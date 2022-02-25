import React, { useState } from 'react';
import ReactDOM from 'react-dom';

import ParticipantList from './ParticipantList'

import './index.css';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);

  return (<>
    <h1>Flask & Twilio Video Conference</h1>
    <form>
      <label for="username">Name: </label>
      <input type="text" name="username" id="username" />
      <button id="join_leave">Join call</button>
      <button id="share_screen">Share screen</button>
      <button id="toggle_chat">Toggle chat</button>
    </form>

    <ParticipantCountDisplay
      isConnected={isConnected}
      participantCount={participantCount} />

    <div className="root">

      <ParticipantList
        count={participantCount}
        onCountChange={setParticipantCount} />

      <div id="chat">
        <div id="chat-scroll">
          <div>
          </div>
        </div>
        <input id="chat-input" type="text" />
      </div>
    </div>
  </>);
}

ReactDOM.render(<App />, document.getElementById('twilio-conference-app')); 

function ParticipantCountDisplay(props) {
  let countText = "Disconnected.";
  if (props.isConnected) {
    countText = `${props.participantCount} participants online.`
  }

  return (
    <p id="count">{countText}</p>
  );
}
