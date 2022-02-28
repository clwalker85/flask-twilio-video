import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Video from 'twilio-video'

import { login, getAllParticipants, disconnectAllParticipants } from './proxies/twilio'
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
  const [participantStatusList, setParticipantStatusList] = useState([]);
  useEffect(() => {
    // TODO - Add better validation than an alert or a silent block
    if (isConnecting && !!username) {
      login(username).then((data) => {
        setToken(data.token);
        setConversationSID(data.conversation_sid);
        return Video.connect(data.token);
      }).then((_room) => {
        _room.on('disconnected', () => { setIsDisconnecting(true); });
        _room.on('participantConnected', () => {
          getAllParticipants().then((data) => {
            setParticipantStatusList(data.participants);
          });
        });
        _room.on('participantDisonnected', () => {
          getAllParticipants().then((data) => {
            setParticipantStatusList(data.participants);
          });
        });

        getAllParticipants().then((data) => {
          setParticipantStatusList(data.participants);
        });

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
  const handleScreenShareToggle = (e) => {
    e.preventDefault();
    setIsScreenShared(!isScreenShared);
  }
  const shareScreenButtonText = isScreenShared ? "Stop sharing" : "Share screen";

  const [screenTrack, setScreenTrack] = useState(null);
  useEffect(() => {
    const disconnectScreenShare = () => {
      if (screenTrack) {
        room.localParticipant.unpublishTrack(screenTrack);
        screenTrack.stop();
        setScreenTrack(null);
      }
      setIsScreenShared(false);
    }

    if (screenTrack && !isScreenShared) {
      disconnectScreenShare();
    }
    else if (!screenTrack && isScreenShared) {
      navigator.mediaDevices.getDisplayMedia().then(stream => {
        const _screenTrack = new Video.LocalVideoTrack(stream.getTracks()[0]);
        room.localParticipant.publishTrack(_screenTrack);
        _screenTrack.mediaStreamTrack.onended = disconnectScreenShare;
        setScreenTrack(_screenTrack);
      });
      // TODO - Add better UI when we catch an error
    }
  }, [isScreenShared]);

  const [isChatDisplayed, setIsChatDisplayed] = useState(false);
  const handleChatToggle = (e) => {
    e.preventDefault();
    setIsChatDisplayed(!isChatDisplayed);
  }
  const handleChatDisplayChange = (isOn) => setIsChatDisplayed(isOn);

  const [isDisconnectingAllParticipants, setIsDisconnectingAllParticipants] = useState(false);
  const handleDisconnectAll = (e) => {
    e.preventDefault();
    setIsDisconnectingAllParticipants(true);
  }
  useEffect(() => {
    if (isDisconnectingAllParticipants) {
      disconnectAllParticipants().then((data) => {
        setIsDisconnecting(true);
      }).catch(e => console.log(e)).finally(() => {
        setIsDisconnectingAllParticipants(false);
      });
    }
  }, [isDisconnectingAllParticipants]);

  const statusList = (isConnected ? (
    <ul>
      {participantStatusList.map((p,_) => {
        return (<li><b>{p.identity}</b> - {p.status}</li>)
      })}
    </ul>
  ) : "");

  return (<>
    <h1>Flask/React/Twilio Video Conference</h1>
    {statusList}
    <form>
      <label for="username">Name: </label>
      <input type="text" name="username" id="username" value={username} onChange={handleUsernameChange} />

      <button id="join_leave" onClick={handleTwilioConnectToggle} disabled={isConnecting}>
        {joinLeaveButtonText}
      </button>
      <button id="share_screen" onClick={handleScreenShareToggle} disabled={!isConnected}>
        {shareScreenButtonText}
      </button>
      <button id="toggle_chat" onClick={handleChatToggle} disabled={!isConnected}>
        Toggle chat
      </button>
      <button id="disconnect_all" onClick={handleDisconnectAll} disabled={!isConnected}>
        Disconnect all
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
