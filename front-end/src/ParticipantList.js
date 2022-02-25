import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { createLocalVideoTrack } from 'twilio-video'

import './ParticipantList.css';

function ParticipantList(props) {
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    createLocalVideoTrack().then((track) => {
      setParticipants([
        {
          sid: "local",
          label: "Me",
          track: track
        }
      ]);
    });

    return () => {
      setParticipants([]);
    }
  }, []);

  return (
    <div id="container" className="container">
      {participants.map((p,_) => {
        return <Participant participant={p} />
      })}
    </div>
  );
}

function Participant({ participant }) {
  const videoRef = useRef();

  useEffect(() => {
    if (participant.track) {
      participant.track.attach(videoRef.current);

      return () => {
        participant.track.detach();
      }
    }
  }, []);

  return (
    <div className="participant" id={participant.sid}>
      <div>
        <video ref={videoRef} autoPlay={true} />
      </div>
      <div className="label">{participant.label}</div>
    </div>
  );
}

export default ParticipantList

