import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { createLocalVideoTrack } from 'twilio-video'

import './ParticipantList.css';

function ParticipantList(props) {
  const [participants, setParticipants] = useState([]);
  useEffect(() => {
    createLocalVideoTrack().then((track) => {
      setParticipants([{ sid: "local", label: "Me", track: track }]);
    });
    return () => setParticipants(participants.filter(p => p.sid == 'local'));
  }, [props.token]);
  useEffect(() => {
    const participantConnected = (connectedParticipant) => {
      if (connectedParticipant.tracks) {
        let track = null;
        connectedParticipant.tracks.forEach(publication => {
          if (publication.isSubscribed) {
            track = publication.track;
          }
        });
        props.onCountChange(participants.length + 1);
        setParticipants([...participants, {
          sid: connectedParticipant.sid,
          label: connectedParticipant.identity,
          track: track
        }]);
      }
    }
    const participantDisconnected = (disconnectedParticipant) => {
      props.onCountChange(participants.length - 1);
      setParticipants(participants.filter(p => p.sid !== disconnectedParticipant.sid));
    }

    if (props.room) {
      props.room.participants.forEach(participantConnected);
      props.room.on('participantConnected', participantConnected);
      props.room.on('participantDisconnected', participantDisconnected);
    }
  }, [props.token, props.room]);
  useEffect(() => {
    props.onCountChange(participants.length);
    return () => props.onCountChange(0);
  }, [participants]);

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
          isHidden={(p.sid != "local" && p.sid != zoomedInParticipantSID)}
          onVideoClick={handleVideoClick} />
      })}
    </div>
  );
}

function Participant({ participant, isZoomedIn, isHidden, onVideoClick }) {
  const videoRef = useRef();
  useEffect(() => {
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
      <div className={(isZoomedIn ? "trackZoomed" : "")}>
        <video className={(isZoomedIn ? "trackZoomed" : "")}
          ref={videoRef} autoPlay={true} onClick={() => onVideoClick(participant.sid)} />
      </div>
      <div className="label">{participant.label}</div>
    </div>
  );
}

export default ParticipantList

