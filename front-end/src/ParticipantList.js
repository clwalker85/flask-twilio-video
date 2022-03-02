import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { createLocalVideoTrack } from 'twilio-video'

import './ParticipantList.css'

function ParticipantList(props) {
  const [participants, setParticipants] = useState([]);
  useEffect(() => {
    createLocalVideoTrack().then((track) => {
      setParticipants([{ sid: "local", identity: "Me", track: track }]);
    });
    return () => setParticipants(participants.filter(p => p.sid == 'local'));
  }, [props.token]);
  useEffect(() => {
    const participantConnected = (connectedParticipant) => {
      setParticipants([...participants, connectedParticipant]);
    }
    const participantDisconnected = (disconnectedParticipant) => {
      setParticipants(participants.filter(p => p.sid !== disconnectedParticipant.sid));
    }

    if (props.room) {
      props.room.participants.forEach(participantConnected);
      props.room.on('participantConnected', participantConnected);
      props.room.on('participantDisconnected', participantDisconnected);
    }
    else {
      setParticipants(participants.filter(p => p.sid == 'local'));
    }
  }, [props.token, props.room]);

  const [zoomedInParticipantSID, setZoomedInParticipantSID] = useState(null);
  const handleVideoClick = (sid) => {
    if (sid == zoomedInParticipantSID) {
      setZoomedInParticipantSID(null);
    }
    else {
      setZoomedInParticipantSID(sid);
    }
  }

  return (
    <div id="container" className="container">
      {participants.map((p,_) => {
        return <Participant participant={p}
          isZoomedIn={(p.sid == zoomedInParticipantSID)}
          isHidden={(zoomedInParticipantSID != null && p.sid != zoomedInParticipantSID)}
          onVideoClick={handleVideoClick} />
      })}
    </div>
  );
}

function Participant({ participant, isZoomedIn, isHidden, onVideoClick }) {
  const videoRef = useRef();
  useEffect(() => {
    if (participant.on) {
      participant.on('trackSubscribed', track => track.attach(videoRef.current));
      participant.on('trackUnsubscribed', track => track.detach());
    }
    if (participant.track) {
      participant.track.attach(videoRef.current);
      return () => participant.track.detach();
    }
  }, []);

  let participantClassList = "participant ";
  if (isZoomedIn) {
    participantClassList += "participantZoomed";
  }
  else if (isHidden) {
    participantClassList += "participantHidden";
  }

  return (
    <div className={participantClassList} id={participant.sid}>
      <div>
        <video className={(isZoomedIn ? "trackZoomed" : "")}
          ref={videoRef} autoplay={true} onClick={() => onVideoClick(participant.sid)} />
      </div>
      <div className="label">{participant.identity}</div>
    </div>
  );
}

export default ParticipantList

