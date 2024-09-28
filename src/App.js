import React, { useState, useEffect } from 'react';
import { FaPlus, FaCheck, FaTrash, FaHeadphones, FaEdit, FaSignOutAlt, FaFileWord, FaFileAlt, FaCalendar, FaPlay, FaReadme, FaArrowLeft, FaCheckDouble, FaClock, FaFont } from 'react-icons/fa';
import './App.css';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, deleteDoc, getDocs, startAfter, collection, query, where, orderBy, and, onSnapshot, addDoc, updateDoc, limit, persistentLocalCache, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getAuth, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, GoogleAuthProvider } from 'firebase/auth';
import { Helmet } from 'react-helmet';

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
  const [userName, setUserName] = useState('Devansh');
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
            </div>
          ))}
        </div>
        <br />
        <br />
        {rewards.map((reward, index) => (
          <div key={index}>
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
          </div>
        ))}
      </div>
      <br />
      <br />
      <div className="activities">
        {punishments.map((punishment, index) => (
          <div key={index}>
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
          </div>
        ))}
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
          History of Activities
        </button>
      </div>
    </div>
  );
}

export default App;