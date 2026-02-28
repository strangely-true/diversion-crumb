"use client";

import { useId } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type AdminDeleteUserDialogProps = {
  userId: string;
  userEmail: string;
  disabled?: boolean;
  action: (formData: FormData) => void | Promise<void>;
};

export default function AdminDeleteUserDialog({
  userId,
  userEmail,
  disabled = false,
  action,
}: AdminDeleteUserDialogProps) {
  const formId = useId();

  return (
    <>
      <form id={formId} action={action}>
        <input type="hidden" name="userId" value={userId} />
      </form>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button type="button" size="sm" variant="destructive" disabled={disabled}>
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The account for {userEmail} will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction type="submit" form={formId} variant="destructive" disabled={disabled}>
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}