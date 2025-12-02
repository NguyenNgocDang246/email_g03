
import { useState } from "react";
import { useMail } from "../../context/MailContext";
import { SendHorizontalIcon, Trash } from "lucide-react";


const NewMessage = () => {
  const [to, setTo] = useState<string>("");
  const [cc, setCc] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [body, setBody] = useState<string>("");
  const {selectOnNewMail,setSelectOnNewMail}=useMail();
  console.log(selectOnNewMail)

  return (
    <div
      className={`border rounded-md bg-white shadow py-2 w-full h-full max-w-3xl mx-auto ${
        selectOnNewMail ? "block" : "hidden"
      }`}
    >
      {/* Send Row */}
      <div className=" flex justify-between items-center px-4">
        <div className="flex items-center gap-2 mb-2">
          <button className="bg-blue-600 hover:bg-blue-700 text-white  px-6  py-2 rounded flex items-center gap-2 justify-center font-medium shadow-md transition-colors">
            <SendHorizontalIcon size={18} />
            Sent
          </button>
        </div>

        <Trash size={18} className="text-gray-500" onClick={()=>{setSelectOnNewMail(false)}} />
      </div>

      <div className="border-b border-gray-300  w-full"></div>

      {/* To */}
      <div className="flex items-center border-b py-2 px-4">
        <div className="w-16 font-medium text-black border border-gray-200 text-center rounded">
          To
        </div>
        <input
          type="text"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="flex-1 outline-none border-b border-gray-200 mx-2 text-black"
        />
      </div>

      {/* Cc */}
      <div className="flex items-center border-b py-2 px-4">
        <div className="w-16 font-medium text-black border border-gray-200 text-center rounded">
          Cc
        </div>
        <input
          type="text"
          value={cc}
          onChange={(e) => setCc(e.target.value)}
          className="flex-1 outline-none border-b border-gray-200 mx-2 text-black"
        />
      </div>

      {/* Subject */}
      <div className="border-b p-2 px-4">
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full outline-none border-b border-b-gray-200 text-black"
          placeholder="Add subject"
        />
      </div>

      {/* Body */}
      <div className="p-2 h-64 px-4">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full h-full outline-none resize-none text-black"
          placeholder="Nhập / để chèn tệp và nội dung khác"
        ></textarea>
      </div>
    </div>
  );
}

export default NewMessage