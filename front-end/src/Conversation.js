import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { Client } from '@twilio/conversations'
import { Form, Input } from 'antd'

import './Conversation.css'

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
          setMessages(prevMessages => [...prevMessages, { author: m.author, body: m.body }]);
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

  const [form] = Form.useForm();
  const conversationEndRef = useRef();
  useEffect(() => {
    if (props.isChatDisplayed) {
      conversationEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, props.isChatDisplayed]);
  const handleKeyDown = (e) => {
    if (e.keyCode == 13) {
      conversation.sendMessage(e.target.value);
      form.resetFields();
    }
  };

  return (
    <div id="chat" className={(props.isChatDisplayed ? 'displayed' : 'hidden')}>
      <div id="chat-scroll">
        <div id="chat-content">
          {messages.map((m,index) => {
            if (index === messages.length - 1) {
              return (
                <p ref={index === messages.length - 1 ? conversationEndRef : ""}>
                  <b>{m.author}</b>: {m.body}
                </p>
              );
            }
            return (<p><b>{m.author}</b>: {m.body}</p>);
          })}
        </div>
      </div>
      <Form form={form}>
        <Form.Item name="chatMessageBox">
          <Input id="chat-input" type="text" onKeyDown={handleKeyDown} placeholder="Enter chat here" />
        </Form.Item>
      </Form>
    </div>
  );
}

export default Conversation

