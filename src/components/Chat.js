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

  useEffect(() => { fetchGroupData() }, [])
  useEffect(() => {
    if (groupData !== null) {
      socket.removeAllListeners()
      socket.on('message', onReceiveMessage);
      socket.on('join', onJoinGroup);
      return () => socket.off("broadcast_msg", onJoinGroup);
    }
  }, [groupData]);

  /**
   * The function fetches group data from an API, sets the data, emits a socket event to join a room,
   * and handles errors and loading state.
   */
  const fetchGroupData = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/group/${groupid}`);
      setGroupData(response.data);
      const joinPayload = {
        groupid, name,
        groupName: response?.data?.name
      }

      socket.emit('joinRoom', joinPayload);
    } catch (error) {
      console.error('Error fetching group:', error);
    } finally {
      setLoading(false);
    }
  }

  /**
   * The function `onReceiveMessage` decrypts an encrypted message using a specified key and adds the
   * decrypted message to the list of messages.
   * @param encryptedMessage - The `encryptedMessage` parameter is an object that contains an encrypted
   * message. It likely has a property named `message` that holds the encrypted message content.
   */
  const onReceiveMessage = (encryptedMessage) => {
    const bytes = CryptoJS.AES.decrypt(encryptedMessage.message, groupData?.key);
    const decryptedMessage = { ...encryptedMessage, message: bytes.toString(CryptoJS.enc.Utf8) };
    setMessages((prevMessages) => [...prevMessages, decryptedMessage]);
  }

  /**
   * The `onJoinGroup` function adds a new message of type 'join' with the given name to the existing
   * messages array.
   */
  const onJoinGroup = name => {
    setMessages((prevMessages) => [...prevMessages, { message: '', type: 'join', name: name }]);
  }



  /**
   * The `sendMessage` function encrypts a message using AES and sends it via a socket connection.
   */
  const sendMessage = () => {
    if (message) {
      const encryptedMessage = CryptoJS.AES.encrypt(message, groupData?.key).toString();
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
                <ListGroup variant="flush" style={{ height: '80vh', overflowY: 'auto' }}>
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
