import { EmailDetail } from "../Email/EmailDetail";

interface EmailDetailPanelProps {
  mailboxId: string;
  emailId: string | null;
  onMarkAsUnread: () => void;
  onDelete: () => void;
  onSnooze?: (durationMs: number) => void;
  onBack?: () => void; // ✅ Thêm prop này
}

export const EmailDetailPanel = ({
  mailboxId,
  emailId,
  onMarkAsUnread,
  onDelete,
  onSnooze,
  onBack, // ✅ Nhận prop
}: EmailDetailPanelProps) => {
  return (
    // Container này chỉ lo việc layout full chiều cao,
    // việc hiển thị Header/Back button để EmailDetail tự lo
    <div className="bg-white rounded-none sm:rounded-lg shadow-none sm:shadow-sm border-0 sm:border border-gray-200 h-full w-full overflow-hidden flex flex-col">
      <EmailDetail
        mailBoxId={mailboxId}
        emailId={emailId}
        onMarkAsUnread={onMarkAsUnread}
        onDelete={onDelete}
        onSnooze={onSnooze}
        onBack={onBack} // ✅ Truyền xuống
      />
    </div>
  );
};
