import React, { useContext } from "react";
import { assets } from "../../assets/assets";
import { Context } from "../../context/Context";
import { marked } from "marked";

const ChatHistory = () => {
    const { chats, activeChatId, loading } = useContext(Context);
    
    // Get current chat messages
    const currentChat = activeChatId ? chats[activeChatId] || [] : [];

    return (
        <div className="chat-history">
            {currentChat.map((message, index) => (
                <div key={index} className="result">
                    {message.role === "user" ? (
                        <div className="result-title">
                            <img src={assets.user_icon} alt="User" />
                            <p>{message.content}</p>
                        </div>
                    ) : (
                        <div className="result-data">
                            <img src={assets.gemini_icon} alt="Gemini" />
                            {loading && index === currentChat.length - 1 ? (
                                <div className="loader">
                                    <hr />
                                    <hr />
                                    <hr />
                                </div>
                            ) : (
                                <div dangerouslySetInnerHTML={{ __html: marked(message.content) }} />
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ChatHistory;