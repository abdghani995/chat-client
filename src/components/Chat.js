import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import CryptoJS from 'crypto-js';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { uniqueNamesGenerator, names } from 'unique-names-generator';
import { v4 as uuidv4 } from 'uuid';
import { Container, Row, Col, Form, Button, ListGroup, Spinner } from 'react-bootstrap';

const API_URL = process.env.REACT_APP_API_URL


const config = { dictionaries: [names] }
const socket = io(API_URL);
const senderId = uuidv4().toString();
const name = uniqueNamesGenerator(config)

const Chat = () => {
  let { groupid } = useParams();



  const [groupData, setGroupData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const secretKey = 'your-secret-key'; // Replace with a more secure key or implement key exchange

  useEffect(() => { 
    console.log("calling fetch");
    fetchGroupData() 
  }, [])
  

  const fetchGroupData = async () => {
    console.log("fetch group called");

    try {
      const response = await axios.get(`${API_URL}/api/group/${groupid}`);
      setGroupData(response.data);
      const joinPayload = {
        groupid, name,
        groupName: response?.data?.name
      }
      console.log("emitting");

      socket.emit('joinRoom', joinPayload);
    } catch (error) {
      console.error('Error fetching group:', error);
    } finally {
      setLoading(false);
    }
  }

  const onReceiveMessage = (encryptedMessage) => {
    const bytes = CryptoJS.AES.decrypt(encryptedMessage.message, secretKey);
    const decryptedMessage = { ...encryptedMessage, message: bytes.toString(CryptoJS.enc.Utf8) };
    setMessages((prevMessages) => [...prevMessages, decryptedMessage]);
  }
  const onJoinGroup = name => {
    setMessages((prevMessages) => [...prevMessages, { message: '', type: 'join', name: name }]);
  }

  useEffect(() => {
    if (groupData !== null) {
      socket.removeAllListeners()
      socket.on('message', onReceiveMessage);
      socket.on('join', onJoinGroup);
      return () => socket.off("broadcast_msg", onJoinGroup);
    }
  }, [groupData]);

  const sendMessage = () => {
    if (message) {
      const encryptedMessage = CryptoJS.AES.encrypt(message, secretKey).toString();
      socket.emit('message', { message: encryptedMessage, name, senderId, groupid, type: 'text' });
      setMessage('');
    }
  };

  return (
    <div>
      {
        !loading && (
          <Container className="mt-4 vh-100 vw-100" >
            <h3 className='py-4'>Welcome <i>{name}</i> to {groupData?.name}</h3>
            <Row>
              <Col>
                <ListGroup variant="flush"  style={{ height: '80vh', overflowY: 'auto' }}>
                  {messages.map((message, index) => (
                    <>
                      {message.type === 'text' && (<ListGroup.Item
                        key={index}
                        className={`d-flex justify-content-${message.senderId === senderId ? 'end' : 'start'}`}
                      >

                        <div
                          className={`p-2 rounded ${message.senderId === senderId ? 'bg-primary text-white' : 'bg-light'
                            }`}
                          style={{ maxWidth: '70%', minWidth: '100px' }}
                        >
                          <strong>{message.name}</strong>
                          <p>
                            {message.message}
                          </p>
                        </div>
                      </ListGroup.Item>)}
                      {
                        message.type === 'join' && (<ListGroup.Item
                          key={index}
                          className={`d-flex justify-content-center`}
                        >
                          <p>
                            {message.name} joined the group
                          </p>
                        </ListGroup.Item>)
                      }

                    </>
                  )
                  )}
                </ListGroup>
              </Col>
            </Row>
            <Row className="mt-3">
              <Col>
                <Form.Group className="d-flex">
                  <Form.Control
                    type="text"
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' ? sendMessage() : null}
                  />
                  <Button variant="primary" onClick={sendMessage} className="ms-2">
                    Send
                  </Button>
                </Form.Group>
              </Col>
            </Row>
          </Container>
        )
      }
      {
        loading && <div className='d-flex justify-content-center mt-5'>
          <Spinner animation="border" />
        </div>
      }
    </div>
  );

};

export default Chat;
