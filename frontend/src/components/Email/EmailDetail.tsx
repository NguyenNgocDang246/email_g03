import { useQuery } from "@tanstack/react-query";
import { Mail, Star } from "lucide-react";
import React, { Suspense, useState } from "react";
import { getEmailDetail } from "../../api/inbox";
import { Trash } from "lucide-react";
import { SendHorizonal } from "lucide-react";
import { useMail } from "../../context/MailContext";

interface EmailDetailProps {
    emailId: number | null;
    onMarkAsUnread: () => void;
    onDelete: () => void;
}

export const EmailDetail: React.FC<EmailDetailProps> = ({
    emailId,
    onMarkAsUnread,
}) => {
    // const navigate = useNavigate();
    // if (!accessToken) {
    //   navigate("/login");
    //   return null;
    // }

    const { data, isLoading, error } = useQuery({
        queryKey: ["mailDetailInfo", emailId],
        queryFn: () => getEmailDetail(emailId!),
        retry: false,
        refetchOnWindowFocus: false,
        enabled: !!emailId,
    });
    
    const {selectOnNewMail}=useMail()
    console.log(selectOnNewMail)
    const [message, setMessage] = useState("");
    const [isReply, setIsReply]=useState(false);

    if (isLoading) return <p className="text-center mt-10">Loading...</p>;
    if (error)
        return (
            <p className="text-center mt-10 text-red-600">
                Error loading mailboxes info
            </p>
        );

    if (!emailId) {
        return (
          <div
            className={`w-full h-screen ${
              selectOnNewMail ? "hidden" : "block"
            }`}
          >
            <div className="h-full flex justify-center items-center text-gray-400">
              <div className="text-center">
                <Mail className="w-24 h-24 mx-auto mb-4 opacity-20" />
                <p className="text-lg">Select an email to view details</p>
              </div>
            </div>
          </div>
        );
    }

    return (
      <Suspense
        fallback={
          <div className="p-6 w-full flex justify-center items-center h-full">
            <p className="text-gray-400 text-lg">Loading email...</p>
          </div>
        }
      >
        <div
          className={`scrollbar overflow-y-auto h-full ${
            selectOnNewMail ? "hidden" : "block"
          }`}
        >
          <div className="bg-white m-2 rounded shadow">
            <div className="p-3">
              <h1 className="text-xl font-semibold text-black">
                {data?.subject}
              </h1>
            </div>
          </div>
          <div className="bg-white m-2 rounded shadow p-3">
            {/* SENDER + RECIPIENTS */}
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {data?.sender.name.charAt(0)}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-black">
                    {data?.sender.name} ({data?.sender.email})
                  </span>

                  <button className="p-1 hover:bg-gray-200 rounded">
                    <Star
                      className={`w-4 h-4 ${
                        data?.isStarred
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-400"
                      }`}
                    />
                  </button>
                </div>

                {/* RECIPIENTS */}
                <p className="text-gray-500 text-sm">
                  To: {data?.recipients.map((r) => r.email).join(", ")}
                </p>

                {/* DATE */}
                <p className="text-gray-400 text-xs">{data?.timestamp}</p>
              </div>
            </div>

            {/* BODY */}
            <div className="pl-12 pr-3 my-4">
              <div
                className="prose max-w-none text-black"
                dangerouslySetInnerHTML={{ __html: data?.body ?? "" }}
              />

              {/* ATTACHMENTS */}
              {data?.attachments && data?.attachments.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium text-black mb-2">Attachments</h3>
                  <ul className="space-y-2">
                    {data?.attachments.map((file) => (
                      <li
                        key={file.id}
                        className="flex justify-between items-center p-2 bg-gray-100 rounded"
                      >
                        <span>{file.fileName}</span>
                        <a
                          href={file.url}
                          target="_blank"
                          className="text-blue-600 font-medium hover:underline"
                        >
                          Download
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div className="flex items-center gap-2 mt-6">
                <button
                  className="px-4 py-2 hover:bg-gray-200 border border-gray-300 rounded text-black"
                  onClick={onMarkAsUnread}
                >
                  Mark as unread
                </button>
                <button
                  className="px-4 py-2  text-black  hover:bg-gray-200 border border-gray-300 rounded"
                  onClick={() => {
                    setIsReply(true);
                  }}
                >
                  Reply
                </button>
              </div>
            </div>
          </div>
          <div
            className={`bg-white m-2 rounded shadow p-3 ${
              isReply ? "block" : "hidden"
            }`}
          >
            {/* SENDER + RECIPIENTS */}
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {data?.sender.name.charAt(0)}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-black">
                    {data?.sender.name} ({data?.sender.email})
                  </span>

                  <button className="p-1 hover:bg-gray-200 rounded">
                    <Star
                      className={`w-4 h-4 ${
                        data?.isStarred
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-400"
                      }`}
                    />
                  </button>
                </div>

                {/* RECIPIENTS */}
                <p className="text-gray-500 text-sm">
                  To: {data?.sender.email}
                </p>
              </div>
            </div>

            {/* BODY /*/}
            <div className="pl-12 pr-3 my-4">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message..."
                className="w-full min-h-[150px] border border-gray-300 rounded p-3 text-black focus:outline-none focus:border-blue-500"
              />

              {/* ACTION BUTTONS */}
              <div className="flex items-center gap-2 mt-6">
                <button className="px-4 py-2 hover:bg-gray-200 border border-gray-300 rounded text-black flex items-center gap-2">
                  <SendHorizonal size={18} />
                  Sent
                </button>

                <button
                  className="px-4 py-2 text-black hover:bg-gray-200 border border-gray-300 rounded flex items-center gap-2"
                  onClick={() => {
                    setIsReply(false);
                  }}
                >
                  <Trash size={18} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </Suspense>
    );
};
