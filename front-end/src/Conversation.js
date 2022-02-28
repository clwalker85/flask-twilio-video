import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Client } from '@twilio/conversations'

import './Conversation.css';

function Conversation(props) {
  const [messages, setMessages] = useState([]);
  const [chat, setChat] = useState(null);
  useEffect(() => {
    if (props.token) {
      Client.create(props.token).then((_chat) => {
        setChat(_chat);
      }).catch((e) => console.log(e));
    }

    return () => {
      if (chat) {
        chat.shutdown().then(() => {
          setChat(null);
          setMessages([]);
        });
      }
    }
  }, [props.token]);

  const [conversation, setConversation] = useState(null);
  useEffect(() => {
    if (chat && props.conversationSID) {
      chat.getConversationBySid(props.conversationSID).then((_conv) => {
        _conv.on('messageAdded', (m) => {
          setMessages(messages.push({ author: m.author, body: m.body }));
        });

        _conv.getMessages().then((_messages) => {
          setMessages(_messages.items.map(m => ({author: m.author, body: m.body})));
          props.setChatDisplay(true);
        });

        setConversation(_conv);
      });
    }

    return () => {
      setConversation(null);
      setMessages([]);
    }
  }, [chat, props.conversationSID]);

  const conversationEndRef = useRef();
  useEffect(() => {
    if (props.isChatDisplayed) {
      conversationEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [props.isChatDisplayed]);
  const handleKeyDown = (e) => {
    if (e.keyCode == 13) {
      conversation.sendMessage(e.target.value);
      e.target.value = "";
      conversationEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  };

  return (
    <div id="chat" className={(props.isChatDisplayed ? 'displayed' : 'hidden')}>
      <div id="chat-scroll">
        <div id="chat-content">
          {messages.map((m,_) => {
            return (<p><b>{m.author}</b>: {m.body}</p>)
          })}
          <div ref={conversationEndRef}></div>
        </div>
      </div>
      <input id="chat-input" type="text" onKeyDown={handleKeyDown} />
    </div>
  );
}

export default Conversation

