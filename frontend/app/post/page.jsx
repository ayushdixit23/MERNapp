"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { API } from "@/Essential";
import { AiFillLike } from "react-icons/ai";
import { RiDeleteBinLine } from "react-icons/ri";
import { FaComments } from "react-icons/fa";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { AiFillDislike } from "react-icons/ai";

const page = () => {
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const [input, setInput] = useState({
    check: false,
    postid: null,
  });
  const handleFileUpload = (e) => {
    setImage(e.target.files[0]);
  };

  const [post, setPost] = useState([]);
  const send = async () => {
    try {
      const data = new FormData();
      data.append("postimage", image);
      data.append("caption", caption);
      const token = JSON.parse(Cookies.get("tokens")) || {};
      console.log(token);
      const res = await axios.post(`${API}/post`, data, {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data.success) {
        fetchPost();
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handlelike = async (postid) => {
    try {
      console.log(postid);
      const token = JSON.parse(Cookies.get("tokens")) || {};
      const res = await axios.post(`${API}/like/posts/${postid}`, null, {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
      });
      console.log(res.data);
      if (res.data.success) {
        fetchPost();
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handledislike = async (postid) => {
    try {
      console.log(postid);
      const token = JSON.parse(Cookies.get("tokens")) || {};
      const res = await axios.post(`${API}/dislike/post/${postid}`, null, {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
      });
      console.log(res.data);
      if (res.data.success) {
        fetchPost();
      }
    } catch (err) {
      console.log(err);
    }
  };

  const deleteComment = async (id, pid, cid) => {
    try {
      const token = JSON.parse(Cookies.get("tokens")) || {};
      const res = await axios.post(
        `${API}/delete/comment/${id}/${pid}/${cid}`,
        null,
        {
          headers: {
            Authorization: `Bearer ${token.access_token}`,
          },
        }
      );
      console.log(res.data);
      if (res.data.success) {
        fetchPost();
      }
    } catch (err) {}
  };

  const comments = async (postid) => {
    try {
      const token = JSON.parse(Cookies.get("tokens")) || {};
      const res = await axios.post(
        `${API}/post/comment/${postid}`,
        {
          message,
        },
        {
          headers: {
            Authorization: `Bearer ${token.access_token}`,
          },
        }
      );
      console.log(res.data);
      if (res.data.success) {
        setInput({ check: false, postid: null });
        setMessage("");
        fetchPost();
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handledelete = async (id, postid) => {
    try {
      const token = JSON.parse(Cookies.get("tokens")) || {};
      const res = await axios.delete(`${API}/delete/${id}/${postid}`, {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
      });
      if (res.data.success) {
        fetchPost();
      } else {
        console.log(res.data.message);
      }
    } catch (err) {}
  };

  const fetchPost = () => {
    axios
      .get(`${API}/getPost`)
      .then((res) => {
        console.log(res.data);
        setPost(res.data.posts);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const logout = async () => {
    try {
      const token = JSON.parse(Cookies.get("tokens")) || {};
      const res = await axios.post(`${API}/logout`, null, {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
      });
      console.log(res.data);
      if (res.data.success) {
        Cookies.remove("tokens");
        router.push("/");
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchPost();
  }, []);

  return (
    <>
      <div className="flex justify-between items-center">
        <div>
          <input
            className="border-2 outline-none p-2 border-black"
            onChange={handleFileUpload}
            type="file"
            name="postimage"
          />
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="border-2 outline-none p-2 border-black"
            placeholder="Enter text"
            type="text"
          />
          <button onClick={send}>Send Data</button>
        </div>
        <button className="bg-black text-white p-2 px-6" onClick={logout}>
          Log Out
        </button>
      </div>
      <div className="flex justify-center items-center">
        <div className="grid grid-cols-3 gap-10">
          {post.map((d, i) => (
            <div key={i} className="border-2 p-2 w-full flex flex-col gap-2">
              <span className="border-b-2 inline-block border-black">
                Uploaded by: {d?.userid.userName}
              </span>
              <img
                src={`http://localhost:5000/${d?.postimage}`}
                className="h-[250px] w-[250px]"
                alt={`image${i}`}
              />
              <div>Caption: {d?.caption}</div>

              <div className="flex justify-between items-center">
                <div className="flex justify-center items-center gap-3">
                  <div className="flex justify-center items-center gap-1">
                    <button
                      onClick={() => handlelike(d?._id)}
                      className="text-xl"
                    >
                      <AiFillLike />
                    </button>
                    <div>{d?.likes?.length}</div>
                  </div>
                  <div className="flex justify-center items-center gap-1">
                    <button
                      onClick={() => handledislike(d?._id)}
                      className="text-xl"
                    >
                      <AiFillDislike />
                    </button>
                    <div>{d?.dislikes?.length}</div>
                  </div>
                  <div className="flex justify-center items-center gap-1">
                    <div
                      onClick={() => setInput({ check: true, postid: d?._id })}
                    >
                      <FaComments />
                    </div>
                    <div>{d?.comments?.length || 0}</div>
                  </div>
                </div>

                <button
                  onClick={() => handledelete(d?.userid._id, d?._id)}
                  className="text-xl"
                >
                  <RiDeleteBinLine />
                </button>
              </div>
              <div className="flex flex-col justify-start w-full items-start gap-3">
                {d?.comments.map((comment, index) => (
                  <div
                    key={index}
                    className="flex justify-between w-full items-center"
                  >
                    <div className="flex flex-col w-full gap-1">
                      <div> Name: {comment.id.userName}</div>
                      <div> Message:{comment.message}</div>
                    </div>
                    <div
                      onClick={() =>
                        deleteComment(comment?.id._id, d?._id, comment._id)
                      }
                      className="text-2xl"
                    >
                      <RiDeleteBinLine />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {input.check && (
        <div className="fixed inset-0 h-screen bg-black/10 z-10"></div>
      )}
      {input.check && (
        <div className="fixed inset-0 z-20">
          <div className="flex justify-center h-screen items-center ">
            <button
              className="bg-black text-white p-2 px-6"
              onClick={() => setInput({ check: false, postid: null })}
            >
              Cancel
            </button>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="border-2 border-black p-2 outline-none"
            />
            <button
              className="bg-black text-white p-2 px-6"
              onClick={() => comments(input.postid)}
            >
              Send Message
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default page;
