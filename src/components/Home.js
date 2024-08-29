import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button, Spinner } from 'react-bootstrap';
const API_URL = process.env.REACT_APP_API_URL


export default function Home() {

  const [healthLoading, sethealthLoading] = useState(true);
  const [live, setLive] = useState(false)
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();


  useEffect(() => {
    checkServer()
  }, [])

  const checkServer = async () => {
    try {
      const response = await axios.get(`${API_URL}`);
      setLive(true)
    } catch (err) {
      setLive(false)
    } finally {
      sethealthLoading(false);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/groups`, { name: groupName });
      // Redirect to the Result page with the group data
      console.log(response.data);
      const { id, name, key, groupid } = response.data
      navigate(`/chat/${groupid}`, { state: { group: response.data } });
    } catch (error) {
      console.error('Error creating group:', error);
      // Handle error appropriately
    } finally {
      sethealthLoading(false);
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
