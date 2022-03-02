import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import Video from 'twilio-video'
import { Typography, Form, Button, Space, Input, List } from 'antd'
const { Title, Text } = Typography

import { login, getAllParticipants, disconnectAllParticipants } from './proxies/twilio'
import ParticipantList from './ParticipantList'
import Conversation from './Conversation'

import 'antd/dist/antd.css'
import './index.css'

function App() {
  const [token, setToken] = useState(null);
  const [conversationSID, setConversationSID] = useState(null);
  const [room, setRoom] = useState(null);

  const [username, setUsername] = useState("");
  const handleUsernameChange = (e) => setUsername(e.target.value);

  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [participantStatusList, setParticipantStatusList] = useState([]);
  useEffect(() => {
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
      setRoom(null);
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
    <List size="small" bordered dataSource={participantStatusList}
      renderItem={p => <List.Item><b>{p.identity}</b> - {p.status}</List.Item>} />
  ) : "");

  return (<>
    <Title level={3}>Flask/React/Twilio Video Conference</Title>

    <Space direction="vertical" size="large">
      {statusList}

      <Form layout="inline">
        <Form.Item name="username" label="Username"
            rules={[{ required: true, message: "Username is required to connect" }]}>
          <Input type="text" name="username" id="username" onChange={handleUsernameChange}
            placeholder="Enter username here" value={username} />
        </Form.Item>

        <Space size="small">
          <Button id="join_leave" type="primary" onClick={handleTwilioConnectToggle} disabled={isConnecting}>
            {joinLeaveButtonText}
          </Button>
          <Button id="share_screen" onClick={handleScreenShareToggle} disabled={!isConnected}>
            {shareScreenButtonText}
          </Button>
          <Button id="toggle_chat" onClick={handleChatToggle} disabled={!isConnected}>
            Toggle chat
          </Button>
          <Button id="disconnect_all" type="danger" onClick={handleDisconnectAll} disabled={!isConnected}>
            Disconnect all
          </Button>
        </Space>
      </Form>
    </Space>

    <div id="root" className={(isChatDisplayed ? 'chat-displayed' : 'chat-hidden')}>

      <ParticipantList room={room} />

      <Conversation
        token={token}
        conversationSID={conversationSID}
        isChatDisplayed={isChatDisplayed}
        setChatDisplay={handleChatDisplayChange} />

    </div>
  </>);
}

ReactDOM.render(<App />, document.getElementById('twilio-conference-app')); 
