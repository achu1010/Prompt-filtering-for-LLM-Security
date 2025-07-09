import React, { useState, useContext } from "react";
import "./Sidebar.css";
import { assets } from "../../assets/assets";
import { Context } from "../../context/Context";

const Sidebar = () => {
    const [extended, setExtended] = useState(false);
    const { newChat, chatList, switchChat, activeChatId, deleteChat } = useContext(Context);

    return (
        <div className="sidebar">
            <div className="top">
                <img 
                    onClick={() => setExtended(prev => !prev)} 
                    className="menu" 
                    src={assets.menu_icon} 
                    alt="menu"
                />
                <div onClick={() => newChat()} className="new-chat">
                    <img src={assets.plus_icon} alt="plus" />
                    {extended ? <p>New Chat</p> : null}
                </div>

                {extended && (
                    <div className="recent">
                        <p className="recent-title">Recent</p>
                        <div className="chat-list">
                            {chatList.map((chat) => (
                                <div 
                                    key={chat.id}
                                    onClick={() => switchChat(chat.id)} 
                                    className={`recent-entry ${activeChatId === chat.id ? 'active' : ''}`}
                                >
                                    <img src={assets.message_icon} alt="message" />
                                    <p>{chat.title}</p>
                                    {activeChatId !== chat.id && (
                                        <img 
                                            src={assets.delete_icon} 
                                            alt="delete"
                                            className="delete-icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteChat(chat.id);
                                            }}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

           <div className="bottom">
                 {/*<div className="bottom-item recent-entry">
                    <img src={assets.question_icon} alt="question" />
                    {extended ? <p>Help</p> : null}
                </div>
                <div className="bottom-item recent-entry">
                    <img src={assets.history_icon} alt="history" />
                    {extended ? <p>Activity</p> : null}
                </div>
                <div className="bottom-item recent-entry">
                    <img src={assets.setting_icon} alt="settings" />
                    {extended ? <p>Settings</p> : null}
                </div>*/}
            </div>
        </div>
    );
};

export default Sidebar;