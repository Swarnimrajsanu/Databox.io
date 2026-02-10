"use client"
import { BACKEND_URL } from "@/utils";
import axios from "axios";
import { useEffect, useState } from "react";

function Appbar() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, [])

  if (!isClient) {
    return <div className="flex justify-between border-b pb-2 pt-2">
      <div className="text-2xl pl-4 flex justify-center flex-col">
        Turkify
      </div>
      <div className="text-xl pr-4 pb-2">
      </div>
    </div>
  }

  return <div className="flex justify-between border-b pb-2 pt-2">
    <div className="text-2xl pl-4 flex justify-center flex-col">
      Turkify
    </div>
    <div className="text-xl pr-4 pb-2">
      {window.localStorage.getItem("token") ? <button className="m-2 p-2 bg-blue-500 text-white rounded" onClick={() => {
        localStorage.removeItem("token");
        window.location.reload();
      }}>Logout</button> : <button className="m-2 p-2 bg-blue-500 text-white rounded" onClick={async () => {
        const response = await axios.post(`${BACKEND_URL}/v1/user/signin`, {

        });
        localStorage.setItem("token", response.data.token);
        window.location.reload();
      }}>Sign in</button>}
    </div>
  </div>
}

export default Appbar
