import { createContext, useState, useEffect, useRef } from "react";
import run from "../config/gemini"; // Ensure correct import path

export const Context = createContext();

export const ContextProvider = ({ children }) => {
    // State for managing chats
    const [chats, setChats] = useState(() => JSON.parse(localStorage.getItem("chats")) || {});
    const [activeChatId, setActiveChatId] = useState(() => localStorage.getItem("activeChatId") || null);
    const [chatList, setChatList] = useState(() => JSON.parse(localStorage.getItem("chatList")) || []);

    // UI states
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [showResult, setShowResult] = useState(false);
    
    // Ref for scrolling
    const chatEndRef = useRef(null);

    // Save chats and chat list in localStorage
    useEffect(() => {
        localStorage.setItem("chats", JSON.stringify(chats));
        localStorage.setItem("chatList", JSON.stringify(chatList));
        localStorage.setItem("activeChatId", activeChatId);
    }, [chats, chatList, activeChatId]);

    // Generate unique ID
    const generateUniqueId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

    // Initialize with a blank chat when first loaded
    useEffect(() => {
        if (chatList.length === 0) {
            newChat();
        }
    }, []);

    // Scroll to bottom when messages update
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [chats, activeChatId]);

    // Create a new chat
    const newChat = () => {
        const newChatId = generateUniqueId();
        setChatList(prev => [{ id: newChatId, title: "New Chat" }, ...prev]);
        setChats(prev => ({ ...prev, [newChatId]: [] }));
        setActiveChatId(newChatId);
        setShowResult(false);
        setInput("");
    };

    // Switch to an existing chat
    const switchChat = (chatId) => {
        setActiveChatId(chatId);
        setShowResult(true);
        setInput("");
    };

    // Delete a chat
    const deleteChat = (chatId) => {
        setChatList(prev => prev.filter(chat => chat.id !== chatId));
        setChats(prev => {
            const newChats = { ...prev };
            delete newChats[chatId];
            return newChats;
        });

        if (chatId === activeChatId) {
            if (chatList.length > 1) {
                const nextChat = chatList.find(chat => chat.id !== chatId);
                if (nextChat) setActiveChatId(nextChat.id);
                else newChat();
            } else {
                newChat();
            }
        }
    };

    // Update chat title
    const updateChatTitle = (chatId, message) => {
        const title = message.length > 20 ? message.substring(0, 20) + "..." : message;
        setChatList(prev => prev.map(chat => (chat.id === chatId ? { ...chat, title } : chat)));
    };

    // Send message
    const onSent = async (customPrompt) => {
        const promptToUse = customPrompt || input;
        if (!promptToUse.trim()) return;
    
        setLoading(true);
        setShowResult(true);
    
        if (!activeChatId) newChat();
        else if (chats[activeChatId].length === 0) updateChatTitle(activeChatId, promptToUse);
    
        try {
            // Add user message to chat
            const updatedChat = [
                ...chats[activeChatId], 
                { role: "user", content: promptToUse }
            ];
            
            setChats(prev => ({
                ...prev,
                [activeChatId]: updatedChat
            }));
    
            // Pass the existing conversation history to the API
            const response = await run(promptToUse, chats[activeChatId]);
            const formattedResponse = formatResponse(response);
    
            setChats(prev => ({
                ...prev,
                [activeChatId]: [...prev[activeChatId], { role: "ai", content: formattedResponse }]
            }));
    
            if (!customPrompt) setInput("");
        } catch (error) {
            console.error("Error fetching response:", error);
            setChats(prev => ({
                ...prev,
                [activeChatId]: [...prev[activeChatId], { role: "ai", content: "Error: Unable to fetch response." }]
            }));
        } finally {
            setLoading(false);
        }
    };
    // Format response to handle markdown
    const formatResponse = (response) => {
        return response.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
    };

    // Handle clicking on card suggestions
    const handleCardClick = (prompt) => {
        setInput(prompt);
        onSent(prompt);
    };

    const contextValue = {
        input,
        setInput,
        loading,
        showResult,
        setShowResult,
        onSent,
        chatEndRef,
        newChat,
        chats,
        activeChatId,
        chatList,
        switchChat,
        deleteChat,
        handleCardClick
    };

    return <Context.Provider value={contextValue}>{children}</Context.Provider>;
};

export default ContextProvider;