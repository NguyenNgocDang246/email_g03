import { EmailDetail } from "../Email/EmailDetail";

interface EmailDetailPanelProps {
  mailboxId: string;
  emailId: string | null;
  onMarkAsUnread: () => void;
  onDelete: () => void;
}

export const EmailDetailPanel = ({
  mailboxId,
  emailId,
  onMarkAsUnread,
  onDelete,
}: EmailDetailPanelProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full overflow-hidden flex flex-col">
      <EmailDetail
        mailBoxId={mailboxId}
        emailId={emailId}
        onMarkAsUnread={onMarkAsUnread}
        onDelete={onDelete}
      />
    </div>
  );
};
