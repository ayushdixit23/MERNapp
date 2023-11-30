"use client";
import React, { useState } from "react";
import axios from "axios";
import { API } from "@/Essential";
import { useRouter } from "next/navigation";

const Signup = () => {
  const [details, setDetails] = useState({
    userName: "",
    email: "",
    password: "",
  });
  const router = useRouter();
  const send = async () => {
    try {
      const data = {
        userName: details.userName,
        email: details.email,
        password: details.password,
      };
      const res = await axios.post(`${API}/signup`, data);
      console.log(res.data);
      if (res.data?.success) {
        router.push("/login");
      }
    } catch (err) {
      console.log(err);
    }
  };
  return (
    <>
      <div className="flex justify-center items-center flex-col gap-4">
        <input
          type="text"
          value={details.userName}
          onChange={(e) => setDetails({ ...details, userName: e.target.value })}
          className="border-2 p-2 outline-none border-black"
          placeholder="userName"
        />
        <input
          type="email"
          value={details.email}
          onChange={(e) => setDetails({ ...details, email: e.target.value })}
          className="border-2 p-2 outline-none border-black"
          placeholder="email"
        />
        <input
          type="password"
          value={details.password}
          onChange={(e) => setDetails({ ...details, password: e.target.value })}
          className="border-2 p-2 outline-none border-black"
          placeholder="password"
        />
      </div>
      <button onClick={send}>Send</button>
    </>
  );
};

export default Signup;
