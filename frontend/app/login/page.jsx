"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { API } from "@/Essential";
import { useRouter } from "next/navigation";

const Login = () => {
  const [details, setDetails] = useState({
    email: "ayush@123.com",
    password: "123",
  });
  const router = useRouter();
  const [tokens, setTokens] = useState({
    access_token: "",
    refresh_token: "",
  });

  useEffect(() => {
    const tokensFromCookie = Cookies.get("tokens");
    if (tokensFromCookie) {
      try {
        const storedTokens = JSON.parse(tokensFromCookie);
        setTokens(storedTokens);
      } catch (error) {
        console.error("Error parsing tokens from cookie:", error);
      }
    }
  }, []);

  const axiosInstance = axios.create();

  useEffect(() => {
    axiosInstance.interceptors.request.use(
      async (config) => {
        if (tokens.access_token) {
          const decodedToken = parseJwt(tokens.access_token);
          const currentTime = Math.floor(Date.now() / 1000);
          if (decodedToken.exp - currentTime < 300) {
            const refreshedTokens = await refreshAccessToken();
            setTokens(refreshedTokens);
            Cookies.set("tokens", JSON.stringify(refreshedTokens));
          }
          config.headers.Authorization = `Bearer ${tokens.access_token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }, [tokens]);

  const parseJwt = (token) => {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  };

  const refreshAccessToken = async () => {
    try {
      const res = await axios.post(`${API}/refresh`, {
        refresh_token: tokens.refresh_token,
      });
      const { access_token, success } = res.data;

      if (success) {
        return { access_token, refresh_token: tokens.refresh_token };
      } else {
        console.log("Failed to refresh token");

        return Promise.reject("Failed to refresh token");
      }
    } catch (err) {
      console.log(err);
      return Promise.reject("Failed to refresh token");
    }
  };

  const send = async () => {
    try {
      const data = {
        email: details.email,
        password: details.password,
      };
      const res = await axios.post(`${API}/login`, data);
      console.log(res.data);
      if (res.data?.success) {
        const tokenDetails = {
          access_token: res.data.access_token,
          refresh_token: res.data.refresh_token,
        };
        Cookies.set("tokens", JSON.stringify(tokenDetails));
        setTokens(tokenDetails);
        router.push("/post");
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <>
      <div className="flex justify-center items-center flex-col gap-4">
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

export default Login;
