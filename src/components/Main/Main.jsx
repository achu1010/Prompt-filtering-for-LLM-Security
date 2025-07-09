import React, { useContext, useState, useEffect } from 'react';
import './Main.css';
import { assets } from '../../assets/assets';
import { Context } from '../../context/Context';
import { marked } from "marked";


const Main = () => {
    const { 
        onSent, 
        showResult, 
        loading, 
        setInput, 
        input, 
        chatEndRef,
        chats,
        activeChatId,
        handleCardClick
    } = useContext(Context);
    
    // New state to track content warnings
    const [contentWarning, setContentWarning] = useState(null);

    // Listen for content warnings in the chat history
    useEffect(() => {
        if (currentChat && currentChat.length > 0) {
            // Look for warning messages in the AI responses
            const lastMessage = currentChat[currentChat.length - 1];
            if (lastMessage.role === 'ai' && lastMessage.content.includes('flagged by our content filter')) {
                setContentWarning(lastMessage.content);
            } else {
                setContentWarning(null);
            }
        }
    }, [chats, activeChatId]);

    const handleSend = () => {
        if (input.trim()) {
            onSent();
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && input.trim()) {
            onSent();
        }
    };

    // Get current chat messages
    const currentChat = activeChatId ? chats[activeChatId] || [] : [];

    return (
        <div className='main'>
            <div className='nav'>
                <p>Gemini</p>
                <img src={assets.user_icon} alt="geminiIcon" />
            </div>
            <div className='main-container'>
                {!showResult || currentChat.length === 0 ? (
                    <>
                        <div className='greet'>
                            <p><span>Hello, </span></p>
                            <p> How can I help you today?</p>
                        </div>
                        <div className="cards">
                            <div className="card" onClick={() => handleCardClick("Write a short story about a time-traveling detective")}>
                                <p>Write a short story about a time-traveling detective</p>
                                <img src={assets.compass_icon} alt='' />
                            </div>
                            <div className="card" onClick={() => handleCardClick("Explain quantum computing in simple terms")}>
                                <p>Explain quantum computing in simple terms</p>
                                <img src={assets.bulb_icon} alt='' />
                            </div>
                            <div className="card" onClick={() => handleCardClick("List tips to stay productive while working from home")}>
                                <p>List tips to stay productive while working from home</p>
                                <img src={assets.message_icon} alt='' />
                            </div>
                            <div className="card" onClick={() => handleCardClick("Convert this paragraph into a professional email")}>
                                <p>Convert this paragraph into a professional email</p>
                                <img src={assets.code_icon} alt='' />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className='chat-history'>
                        {currentChat.map((message, index) => (
                            <div key={index} className={`result ${message.role === 'user' ? 'user' : 'ai'}`}>
                                {message.role === "user" ? (
                                    <div className='result-title'>
                                        <img src={assets.user_icon} alt="User"/>
                                        <p>{message.content}</p>
                                    </div>
                                ) : (
                                    <div className="result-data">
                                        <img src={assets.gemini_icon} alt='Gemini' />
                                        {loading && index === currentChat.length - 1 ? (
                                            <div className='loader'>
                                                <hr />
                                                <hr />
                                                <hr />
                                            </div>
                                        ) : (
                                            message.content.includes('[WARNING]') ? (
                                                <div className="content-warning">
                                                    <p style={{
                                                        color: '#d93025',
                                                        fontWeight: 'bold',
                                                        padding: '10px',
                                                        backgroundColor: '#fce8e6',
                                                        borderRadius: '8px'
                                                    }}>
                                                        ⚠️ {message.content}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div dangerouslySetInnerHTML={{ __html: marked(message.content) }} />
                                            )
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                        {/* Invisible element to scroll to */}
                        <div ref={chatEndRef} />
                    </div>
                )}

                <div className='main-bottom'>
                    <div className='search-box'>
                        <input
                            onChange={(event) => setInput(event.target.value)}
                            value={input}
                            type='text'
                            placeholder='Enter a prompt here'
                            onKeyPress={handleKeyPress}
                        />
                        <div>
                            {/*<img src={assets.gallery_icon} alt='' />
                            <img src={assets.mic_icon} alt='' />*/}
                            {input.trim() ? <img onClick={handleSend} src={assets.send_icon} alt='' /> : null}
                        </div>
                    </div>
                    <p className='bottom-info'>
                        This LLM Platform is free of hate speech and offensive content.
                        {contentWarning && <span style={{color: '#d93025', fontWeight: 'bold'}}> Your last message was blocked.</span>}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Main;