import { NextResponse } from "next/server";
import { AppError } from "./app-error";

type ErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export function toErrorResponse(error: unknown): NextResponse<ErrorBody> {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.statusCode },
    );
  }

  if (isKnownPrismaError(error)) {
    return NextResponse.json(
      {
        error: {
          code: `PRISMA_${error.code}`,
          message: "Database operation failed.",
          details: error.meta,
        },
      },
      { status: 400 },
    );
  }

  if (error instanceof Error && error.name === "PrismaClientValidationError") {
    return NextResponse.json(
      {
        error: {
          code: "PRISMA_VALIDATION_ERROR",
          message: "Invalid database query payload.",
        },
      },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred.",
      },
    },
    { status: 500 },
  );
}

function isKnownPrismaError(error: unknown): error is { code: string; meta?: unknown } {
  if (!(error instanceof Error)) {
    return false;
  }

  if (error.name !== "PrismaClientKnownRequestError") {
    return false;
  }

  const candidate = error as { code?: unknown };
  return typeof candidate.code === "string";
}

export async function withErrorHandling<T>(handler: () => Promise<T>): Promise<T | NextResponse<ErrorBody>> {
  try {
    return await handler();
  } catch (error) {
    return toErrorResponse(error);
  }
}
