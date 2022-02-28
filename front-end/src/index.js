import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Video from 'twilio-video'

import { login } from './proxies/twilio'
import ParticipantList from './ParticipantList'
import Conversation from './Conversation'

import './index.css';

function App() {
  const [token, setToken] = useState(null);
  const [conversationSID, setConversationSID] = useState(null);
  const [room, setRoom] = useState(null);

  const [participantCount, setParticipantCount] = useState(0);
  const handleCountChange = (count) => setParticipantCount(count);

  const [username, setUsername] = useState("");
  const handleUsernameChange = (e) => setUsername(e.target.value);

  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  useEffect(() => {
    // TODO - Add better validation than an alert or a silent block
    if (isConnecting && !!username) {
      login(username).then((data) => {
        setToken(data.token);
        setConversationSID(data.conversation_sid);
        return Video.connect(data.token);
      }).then((_room) => {
        setRoom(_room);
        setIsConnected(true);
      }).catch(e => console.log(e)).finally(() => {
        setIsConnecting(false);
      });
    }
    else {
      setIsConnecting(false);
    }
  }, [isConnecting]);

  const [isDisconnecting, setIsDisconnecting] = useState(false);
  useEffect(() => {
    if (isDisconnecting) {
      room.disconnect();
      setToken(null);
      setConversationSID(null);
      setIsScreenShared(false);
      setIsChatDisplayed(false);
      setIsConnected(false);
      setIsDisconnecting(false);
    }
  }, [isDisconnecting]);

  let joinLeaveButtonText = isConnected ? "Leave call" : "Join call";
  if (isConnecting) joinLeaveButtonText = "Connecting...";
  const handleTwilioConnectToggle = (e) => {
    e.preventDefault();
    if (isConnected) {
      setIsDisconnecting(true);
    }
    else {
      setIsConnecting(true);
    }
  }

  const [isScreenShared, setIsScreenShared] = useState(false);
  const handleScreenShareToggle = () => {
    e.preventDefault();
    setIsScreenShared(!isScreenShared);
  }
  const handleScreenShareDisplayChange = (isOn) => setIsScreenShared(isOn);

  const [isChatDisplayed, setIsChatDisplayed] = useState(false);
  const handleChatToggle = (e) => {
    e.preventDefault();
    setIsChatDisplayed(!isChatDisplayed);
  }
  const handleChatDisplayChange = (isOn) => setIsChatDisplayed(isOn);

  return (<>
    <h1>Flask/React/Twilio Video Conference</h1>
    <form>
      <label for="username">Name: </label>
      <input type="text" name="username" id="username" value={username} onChange={handleUsernameChange} />

      <button id="join_leave" onClick={handleTwilioConnectToggle} disabled={isConnecting}>
        {joinLeaveButtonText}
      </button>
      <button id="share_screen" onClick={handleScreenShareToggle} disabled={!isConnected}>
        Share screen
      </button>
      <button id="toggle_chat" onClick={handleChatToggle} disabled={!isConnected}>
        Toggle chat
      </button>
    </form>

    <ParticipantCountDisplay isConnected={isConnected} participantCount={participantCount} />

    <div id="root" className={(isChatDisplayed ? 'chat-displayed' : 'chat-hidden')}>

      <ParticipantList room={room} onCountChange={handleCountChange} />

      <Conversation
        token={token}
        conversationSID={conversationSID}
        isChatDisplayed={isChatDisplayed}
        setChatDisplay={handleChatDisplayChange} />

    </div>
  </>);
}

ReactDOM.render(<App />, document.getElementById('twilio-conference-app')); 

function ParticipantCountDisplay({ isConnected, participantCount }) {
  const countText = isConnected ? `${participantCount} participants online.` : "Disconnected.";
  return (<p id="count">{countText}</p>);
}
