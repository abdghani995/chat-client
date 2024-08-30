import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button, ListGroup, Spinner } from 'react-bootstrap';
const API_URL = process.env.REACT_APP_API_URL


export default function Home() {

  const [healthLoading, setHealthLoading] = useState(true);
  const [live, setLive] = useState(false)
  const [groupName, setGroupName] = useState('');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();


  useEffect(() => {
    checkServer()
    fetcGroups()
  }, [])

  const checkServer = async () => {
    try {
      const response = await axios.get(`${API_URL}`);
      setLive(true)
    } catch (err) {
      setLive(false)
    } finally {
      setHealthLoading(false);
    }
  }


  const fetcGroups = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/groups`);
      setGroups(data);
    } catch (err) {
      setLive(false)
    }
  }

  const navigateToGroup = groupData => {
    navigate(`/chat/${groupData.groupid}`, { state: { group: groupData } });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/groups`, { name: groupName });
      // Redirect to the Result page with the group data
      navigateToGroup(response.data);
      // const { id, name, key, groupid } = response.data
      // navigate(`/chat/${groupid}`, { state: { group: response.data } });
    } catch (error) {
      console.error('Error creating group:', error);
      // Handle error appropriately
    } finally {
      setHealthLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      {
        !healthLoading && live && (
          <div>
            <h2>Create a Chat Group</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="groupName" className="form-label">Group Name</label>
                <input
                  type="text"
                  className="form-control"
                  id="groupName"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required
                />
              </div>
              {/* <button type="submit" className="btn btn-primary">Create Group</button> */}
              <Button
                variant="primary"
                disabled={loading}
                type="submit"
              >
                {loading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                    />
                    {' '} Loading...
                  </>
                ) : (
                  'Create Group'
                )}
              </Button>
            </form>

            {
              groups.length > 0 && (
                <div className="container mt-5">
                  <h3>Chat Groups</h3>
                  <ListGroup>
                    {groups.map(item => (
                      <ListGroup.Item key={item.id} className="d-flex justify-content-between align-items-center">
                        {item.name}
                        <Button variant="primary" onClick={() => navigateToGroup(item)}>
                          Open
                        </Button>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </div>
              )
            }

            <div>

            </div>
          </div>
        )
      }
      {
        !healthLoading && !live && (
          <div>
            Server is offline
          </div>
        )
      }
      {
        healthLoading && (
          <div className='d-flex justify-content-center mt-5'>
            <Spinner animation="border" />
            <div>
              Loading Server
            </div>
          </div>
        )
      }
    </div>
  );
}
