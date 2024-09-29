import React, { useState, useEffect } from 'react';
import { FaPlus, FaCheck, FaTrash, FaHeadphones, FaEdit,  FaSignOutAlt, FaFileWord, FaFileAlt, FaCalendar, FaPlay, FaReadme, FaArrowLeft, FaCheckDouble, FaClock, FaFont } from 'react-icons/fa';
import './App.css';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, deleteDoc, getDocs, startAfter, collection, query, where, orderBy, and, onSnapshot, addDoc, updateDoc, limit, persistentLocalCache, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getAuth, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, GoogleAuthProvider } from 'firebase/auth';
import { Helmet } from 'react-helmet';
import { useLocation } from 'react-router-dom';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

function App() {
  const getURLParmQuery = new URLSearchParams(window.location.search);
  const defaultUser = getURLParmQuery.get('defaultUser') || 'Devansh';
  const [userName, setUserName] = useState(defaultUser);
  const [user, setUser] = useState(null);
  const [activities, setActivities] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [punishments, setPunishments] = useState([]);
  const [totalScore, setTotalScore] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [history, setHistory] = useState([]);
  const [isScorePopped, setIsScorePopped] = useState(false);
  const [showUserOptions, setShowUserOptions] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('#756060');
  const [faviconPath, setFaviconPath] = useState('/favicon.ico'); // Default favicon
  const [isHistoryVisible, setIsHistoryVisible] = useState(false); // New state to track history visibility
  const [isEditMode, setIsEditMode] = useState(false); // New state for edit mode

  // New state variables for adding new items
  const [newActivity, setNewActivity] = useState('');
  const [newReward, setNewReward] = useState('');
  const [newPunishment, setNewPunishment] = useState('');

  useEffect(() => {
    // Update faviconPath whenever userName changes
    let newFaviconPath = '/favicon.png'; // Default favicon
    if (userName === 'Devansh') {
      newFaviconPath = '/Devansh.png';
    } else if (userName === 'Aarush') {
      newFaviconPath = '/Aarush.jpg';
    } else if (userName === 'Sharath') {
      newFaviconPath = '/Sharath.png';
    } else if (userName === 'Navya') {
      newFaviconPath = '/Navya.png';
    }
    setFaviconPath(newFaviconPath);

    // Clear new item inputs when user changes
    setNewActivity('');
    setNewReward('');
    setNewPunishment('');
  }, [userName]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const todoCollection = collection(db, 'genai', userName, 'MyScoring');
    const scoreDocRef = doc(todoCollection, 'final_score');

    getDoc(scoreDocRef)
      .then((docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          const total_score = data.score || 0;
          setTotalScore(total_score);
          setBackgroundColor(data.background_color);

          if (Array.isArray(data.activities)) {
            setActivities(data.activities);
          } else {
            console.log('No activities array found in final_score document.');
          }
          if (Array.isArray(data.rewards)) {
            setRewards(data.rewards);
          } else {
            console.log('No rewards array found in final_score document.');
          }
          if (Array.isArray(data.punishments)) {
            setPunishments(data.punishments);
          } else {
            console.log('No punishments array found in final_score document.');
          }
        } else {
          console.log('No such document!');
          setActivities([]);
          setRewards([]);
          setPunishments([]);
          setTotalScore(0);
        }
      })
      .catch((error) => {
        console.log('Error getting document:', error);
      });
  }, [userName]);

  // Clear history when userName changes
  useEffect(() => {
    setHistory([]); // Clear history state
    setIsHistoryVisible(false); // Hide history when user changes
  }, [userName]);

  const handleActivityClick = (activity, revert = 0) => {
    if (isEditMode) return; // Disable activity click in edit mode

    let points;
    try {
      points = parseInt(activity.match(/\(([-+]?\d+)\)/)[1], 10);
    } catch {
      points = 10; // Default points if parsing fails
    }

    if (revert > 0) {
      points = -points;
      activity = 'UNDO ' + activity;
    }

    console.log('Points:', points);
    setTotalScore((prevScore) => prevScore + points);
    const todoCollection = collection(db, 'genai', userName, 'MyScoring');
    const scoreDoc = doc(todoCollection, 'final_score');
    updateDoc(scoreDoc, {
      score: totalScore + points,
    });

    // Trigger pop-out effect
    setIsScorePopped(true);
    setTimeout(() => {
      setIsScorePopped(false);
    }, 300); // Duration matches CSS transition

    console.log('Total Score:', totalScore + points);
    const historyDetailsCollection = collection(db, 'genai', userName, 'MyScoring', 'history', 'details');
    addDoc(historyDetailsCollection, {
      activity: activity,
      points: points,
      scoreAfter: totalScore + points,
      timestamp: new Date(),
    })
      .then(() => {
        console.log('Activity logged successfully');
      })
      .catch((error) => {
        console.error('Error logging activity:', error);
      });
  };

  // Modify the showHistory function
  const showHistory = () => {
    if (isHistoryVisible) {
      setIsHistoryVisible(false);
      setHistory([]);
    } else {
      console.log('Show History');
      const historyDetailsCollection = collection(db, 'genai', userName, 'MyScoring', 'history', 'details');
      const historyQuery = query(historyDetailsCollection, orderBy('timestamp', 'desc'));

      getDocs(historyQuery)
        .then((querySnapshot) => {
          const historyData = [];
          querySnapshot.forEach((doc) => {
            historyData.push(doc.data());
            console.log('Activity:', doc.data().activity);
            console.log('Score:', doc.data().scoreAfter);
            console.log('Timestamp:', doc.data().timestamp);
          });
          setHistory(historyData);
          setIsHistoryVisible(true); // Set history visibility to true
        })
        .catch((error) => {
          console.error('Error fetching history:', error);
        });
    }
  };

  // Optionally, fetch history when userName changes and history is visible
  useEffect(() => {
    if (isHistoryVisible) {
      showHistory();
    }
  }, [userName]);

  // Handle user change
  const handleUserChange = (selectedUser) => {
    setUserName(selectedUser);
    setShowUserOptions(false);
    setIsHistoryVisible(false); // Hide history when user changes
    setHistory([]);
  };

  // Handle title changes
  const handleTitleChange = (index, newValue, type) => {
    if (type === 'activity') {
      const updatedActivities = [...activities];
      updatedActivities[index] = newValue;
      setActivities(updatedActivities);
    } else if (type === 'reward') {
      const updatedRewards = [...rewards];
      updatedRewards[index] = newValue;
      setRewards(updatedRewards);
    } else if (type === 'punishment') {
      const updatedPunishments = [...punishments];
      updatedPunishments[index] = newValue;
      setPunishments(updatedPunishments);
    }
  };

  // Save changes to Firebase
  const saveChanges = () => {
    const todoCollection = collection(db, 'genai', userName, 'MyScoring');
    const scoreDoc = doc(todoCollection, 'final_score');
    updateDoc(scoreDoc, {
      activities: activities,
      rewards: rewards,
      punishments: punishments,
    })
      .then(() => {
        alert('Changes saved successfully.');
        setIsEditMode(false);
      })
      .catch((error) => {
        console.error('Error saving changes:', error);
        alert('Error saving changes, please try again.');
      });
  };

  // New functions to add new items
  const addNewActivity = () => {
    if (newActivity.trim() !== '') {
      setActivities([...activities, newActivity.trim()]);
      setNewActivity('');
    }
  };

  const addNewReward = () => {
    if (newReward.trim() !== '') {
      setRewards([...rewards, newReward.trim()]);
      setNewReward('');
    }
  };

  const addNewPunishment = () => {
    if (newPunishment.trim() !== '') {
      setPunishments([...punishments, newPunishment.trim()]);
      setNewPunishment('');
    }
  };

  return (
    <div>
      <Helmet>
        <link rel="icon" href={faviconPath} />
      </Helmet>
      <div className="fixed-header">
        <div className="app" style={{ fontSize: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
              {/* Make image clickable */}
              <img
                src={`${userName}.png`}
                alt={userName}
                style={{ width: '80px', height: '80px', borderRadius: '50%', marginRight: '20px', cursor: 'pointer' }}
                onClick={() => setShowUserOptions(!showUserOptions)}
              />
              Points :
              <span style={{ fontSize: '38px' }}>
                {' '}
                <span className={`score ${isScorePopped ? 'score-popped' : ''}`}>{totalScore}</span>
              </span>
              <button
                className="signoutbutton"
                onClick={() => setIsEditMode(!isEditMode)}
              >
                {isEditMode ? 'Cancel' : 'Edit Mode'}
              </button>
              {isEditMode && (
                <button
                  className="signonpagebutton"
                  onClick={saveChanges}
                  style={{ marginLeft: '4px' }}
                >
                  Save
                </button>
              )}
            </div>
          </div>
          {/* User selection menu */}
          {showUserOptions && (
            <div className="user-options">
              <button onClick={() => handleUserChange('Devansh')}>
                <img
                  src="Devansh.png"
                  alt="Devansh"
                  style={{ width: '50px', height: '50px', borderRadius: '50%' }}
                />
              </button>
              <button onClick={() => handleUserChange('Aarush')}>
                <img
                  src="Aarush.png"
                  alt="Aarush"
                  style={{ width: '50px', height: '50px', borderRadius: '50%' }}
                />
              </button>
              <button onClick={() => handleUserChange('Sharath')}>
                <img
                  src="Sharath.png"
                  alt="Sharath"
                  style={{ width: '50px', height: '50px', borderRadius: '50%' }}
                />
              </button>
              <button onClick={() => handleUserChange('Navya')}>
                <img
                  src="Navya.png"
                  alt="Navya"
                  style={{ width: '50px', height: '50px', borderRadius: '50%' }}
                />
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="content">
        <div className="activities">
          {activities.map((activity, index) => (
            <div key={index}>
              {isEditMode ? (
                <input
                  type="text"
                  value={activity}
                  onChange={(e) => handleTitleChange(index, e.target.value, 'activity')}
                  className="edit-input"
                />
              ) : (
                <button
                  className="button"
                  style={{ backgroundColor: backgroundColor }}
                  onClick={(e) => {
                    handleActivityClick(activity);
                    e.target.classList.add('clicked');
                    setTimeout(() => {
                      e.target.classList.remove('clicked');
                    }, 400);
                  }}
                >
                  {activity}
                </button>
              )}
            </div>
          ))}
          {/* Add new activity in edit mode */}
          {isEditMode && (
            <div className="add-new-item">
              <input
                type="text"
                value={newActivity}
                onChange={(e) => setNewActivity(e.target.value)}
                placeholder="Add new activity"
                className="edit-input"
              />
              <button onClick={addNewActivity} className="add-button"><FaPlus /></button>
            </div>
          )}
        </div>
        <br />
        <br />
        <div className="activities">
          {rewards.map((reward, index) => (
            <div key={index}>
              {isEditMode ? (
                <input
                  type="text"
                  value={reward}
                  onChange={(e) => handleTitleChange(index, e.target.value, 'reward')}
                  className="edit-input"
                />
              ) : (
                <button
                  className="button reward-button"
                  onClick={(e) => {
                    handleActivityClick(reward);
                    e.target.classList.add('clicked');
                    setTimeout(() => {
                      e.target.classList.remove('clicked');
                    }, 400);
                  }}
                >
                  {reward}
                </button>
              )}
            </div>
          ))}
          {/* Add new reward in edit mode */}
          {isEditMode && (
            <div className="add-new-item">
              <input
                type="text"
                value={newReward}
                onChange={(e) => setNewReward(e.target.value)}
                placeholder="Add new reward"
                className="edit-input"
              />
              <button onClick={addNewReward} className="add-button"><FaPlus /></button>
            </div>
          )}
        </div>
        <br />
        <br />
        <div className="activities">
          {punishments.map((punishment, index) => (
            <div key={index}>
              {isEditMode ? (
                <input
                  type="text"
                  value={punishment}
                  onChange={(e) => handleTitleChange(index, e.target.value, 'punishment')}
                  className="edit-input"
                />
              ) : (
                <button
                  className="button punishmentbutton"
                  onClick={(e) => {
                    handleActivityClick(punishment);
                    e.target.classList.add('clicked');
                    setTimeout(() => {
                      e.target.classList.remove('clicked');
                    }, 400);
                  }}
                >
                  {punishment}
                </button>
              )}
            </div>
          ))}
          {/* Add new punishment in edit mode */}
          {isEditMode && (
            <div className="add-new-item">
              <input
                type="text"
                value={newPunishment}
                onChange={(e) => setNewPunishment(e.target.value)}
                placeholder="Add new punishment"
                className="edit-input"
              />
              <button onClick={addNewPunishment} className="add-button"><FaPlus /></button>
            </div>
          )}
        </div>
        <br />
        <br />
        <div>
          <button
            className="historybutton"
            style={{ fontSize: '29px' }}
            onClick={(e) => {
              showHistory();
              e.target.classList.add('clicked');
              setTimeout(() => {
                e.target.classList.remove('clicked');
              }, 400);
            }}
          >
            {isHistoryVisible ? 'Hide History' : 'History of Activities'}
          </button>
        </div>
        {/* Display History */}
        {isHistoryVisible && (
          <div className="history">
            {history.length > 0 ? (
              history.map((item, index) => (
                <div key={index} className="history-item">
                  <p>
                    <strong>Activity:</strong> {item.activity}
                  </p>
                  <p>
                    <strong>Score:</strong> {item.scoreAfter}
                  </p>
                  <p>
                    <strong>Timestamp:</strong>{' '}
                    {new Date(item.timestamp.seconds * 1000).toLocaleString()}
                  </p>
                  <p>
                    <button
                      className="undobutton"
                      onClick={(e) => {
                        handleActivityClick(item.activity, 1);
                        e.target.classList.add('clicked');
                        setTimeout(() => {
                          e.target.classList.remove('clicked');
                        }, 400);
                      }}
                    >
                      Undo
                    </button>
                  </p>
                </div>
              ))
            ) : (
              <p>No history available.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;