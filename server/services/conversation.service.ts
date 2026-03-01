import {
  ConversationStatus,
  AgentType,
  MessageRole,
} from "@/generated/prisma/enums";
import { prisma } from "@/server/prisma/client";

export class ConversationService {
  static async purgeResolvedOlderThanDays(days = 5) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return prisma.conversation.deleteMany({
      where: {
        status: ConversationStatus.RESOLVED,
        updatedAt: { lt: cutoff },
      },
    });
  }

  /** Get an existing conversation by sessionId, or create a new one. */
  static async getOrCreate(sessionId: string, userId?: string) {
    return prisma.conversation.upsert({
      where: { sessionId },
      create: { sessionId, userId },
      update: userId ? { userId } : {},
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
  }

  static async getById(id: string) {
    return prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        user: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });
  }

  static async getBySessionId(sessionId: string) {
    return prisma.conversation.findUnique({
      where: { sessionId },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        user: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });
  }

  static async getMany(filters: {
    status?: ConversationStatus;
    assignedToId?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { status, assignedToId, page = 1, pageSize = 20 } = filters;
    const where = {
      ...(status ? { status } : {}),
      ...(assignedToId ? { assignedToId } : {}),
    };

    const [conversations, total] = await prisma.$transaction([
      prisma.conversation.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1, // last message preview
          },
          _count: { select: { messages: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.conversation.count({ where }),
    ]);

    return { conversations, total, page, pageSize };
  }

  static async addMessage(
    conversationId: string,
    data: {
      role: MessageRole;
      content: string;
      agentType?: AgentType;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      metadata?: any;
    },
  ) {
    const message = await prisma.conversationMessage.create({
      data: {
        conversationId,
        role: data.role,
        content: data.content,
        agentType: data.agentType ?? AgentType.AI,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metadata: data.metadata as any,
      },
    });

    // Bump conversation updatedAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  static async escalate(conversationId: string) {
    return prisma.conversation.update({
      where: { id: conversationId },
      data: {
        status: ConversationStatus.ESCALATED,
        agentType: AgentType.HUMAN,
      },
    });
  }

  static async resolve(conversationId: string) {
    return prisma.conversation.update({
      where: { id: conversationId },
      data: { status: ConversationStatus.RESOLVED },
    });
  }

  static async close(conversationId: string) {
    return prisma.conversation.update({
      where: { id: conversationId },
      data: { status: ConversationStatus.RESOLVED },
    });
  }

  static async delete(conversationId: string) {
    // deleteMany is idempotent — no P2025 thrown if the record is already gone.
    await prisma.conversation.deleteMany({
      where: { id: conversationId },
    });
  }

  static async assign(conversationId: string, agentId: string) {
    return prisma.conversation.update({
      where: { id: conversationId },
      data: { assignedToId: agentId },
    });
  }

  static async patch(
    conversationId: string,
    data: {
      status?: ConversationStatus;
      assignedToId?: string | null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      metadata?: any;
    },
  ) {
    return prisma.conversation.update({
      where: { id: conversationId },
      data,
    });
  }

  /** Summary stats for the support dashboard overview. */
  static async getStats() {
    const [open, escalated, resolved] = await prisma.$transaction([
      prisma.conversation.count({ where: { status: ConversationStatus.OPEN } }),
      prisma.conversation.count({
        where: { status: ConversationStatus.ESCALATED },
      }),
      prisma.conversation.count({
        where: { status: ConversationStatus.RESOLVED },
      }),
    ]);
    return { open, escalated, resolved };
  }
}
