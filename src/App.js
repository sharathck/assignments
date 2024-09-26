import React, { useState, useEffect, unsubscribe } from 'react';
import { FaPlus, FaCheck, FaTrash, FaHeadphones, FaEdit, FaSignOutAlt, FaFileWord, FaFileAlt, FaCalendar, FaPlay, FaReadme, FaArrowLeft, FaCheckDouble, FaClock, FaFont } from 'react-icons/fa';
import './App.css';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, deleteDoc, getDocs, startAfter, collection, query, where, orderBy, and, onSnapshot, addDoc, updateDoc, limit, persistentLocalCache, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getAuth, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, GoogleAuthProvider } from 'firebase/auth';
import { Alignment } from 'docx';


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
const userName = process.env.REACT_APP_USER_NAME;
let uid = '';
let total_score = 0;

function App() {
  console.log('User Name:', userName);
  const [user, setUser] = useState(null);
  const [activities, setActivities] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [punishments, setPunishments] = useState([]);
  const [totalScore, setTotalScore] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [badbehavior10, setBadBehavior10] = useState('Bad Behavior(-10)');


  const [history, setHistory] = useState([]);
  const [isScorePopped, setIsScorePopped] = useState(false);

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
          total_score = data.score || 0;
          setTotalScore(total_score);

          if (Array.isArray(data.activities)) {
            setActivities(data.activities);
          } else {
            console.log('No activities array found in final_score document.');
          }
          if (Array.isArray(data.rewards)) {
            setRewards(data.rewards);
          }
          else {
            console.log('No rewards array found in final_score document.');
          }
          if (Array.isArray(data.punishments)) {
            setPunishments(data.punishments);
          }
          else {
            console.log('No punishments array found in final_score document.');
          }
        } else {
          console.log('No such document!');
        }
      })
      .catch((error) => {
        console.log('Error getting document:', error);
      });
  }, []);


  const handleSignIn = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  };

  const handleSignOut = () => {
    auth.signOut();
  };


  const handlePasswordReset = async () => {
    if (!email) {
      alert('Please enter your email address.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      alert('Password reset email sent, please check your inbox.');
    } catch (error) {
      console.error('Error sending password reset email', error);
    }
  };


  const handleSignInWithEmail = async (e) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      if (!user.emailVerified) {
        await auth.signOut();
        alert('Please verify your email before signing in.');
      }
    } catch (error) {
      if (error.code === 'auth/wrong-password') {
        alert('Wrong password, please try again.');
      } else {
        alert('Error signing in, please try again.' + error.message);
        console.error('Error signing in:', error);
      }
    }
  };

  const handleSignUpWithEmail = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(auth.currentUser);
      const user = userCredential.user;
      alert('Verification email sent! Please check your inbox. Ater verification, please sign in.');
      if (!user.emailVerified) {
        await auth.signOut();
      }
    } catch (error) {
      alert('Error signing up, please try again.' + error.message);
      console.error('Error signing up:', error);
    }
  };


  const handleActivityClick = (activity) => {
    const points = parseInt(activity.match(/\(([-+]?\d+)\)/)[1], 10);
    console.log('Points:', points);
    setTotalScore(prevScore => prevScore + points);
    const todoCollection = collection(db, 'genai', userName, 'MyScoring');
    const scoreDoc = doc(todoCollection, 'final_score');
    updateDoc(scoreDoc, {
      score: totalScore + points
    });
    // Trigger pop-out effect
    setIsScorePopped(true);
    setTimeout(() => {
      setIsScorePopped(false);
    }, 300); // Duration matches CSS transition

    console.log('Total Score:', totalScore + points);
    const hisotryDetailsCollection = collection(db, 'genai', userName, 'MyScoring', 'history', 'details');
    // const activityDoc = doc(todoCollection);
    addDoc(hisotryDetailsCollection, {
      activity: activity,
      points: points,
      scoreAfter: totalScore + points,
      timestamp: new Date()
    }).then(() => {
      console.log('Activity logged successfully');
    }).catch((error) => {
      console.error('Error logging activity:', error);
    });
  };

  const oldhandleActivityClick = (activity, points = 10) => {
    setTotalScore(prevScore => prevScore + points);
    const todoCollection = collection(db, 'genai', userName, 'MyScoring');
    const scoreDoc = doc(todoCollection, 'final_score');
    updateDoc(scoreDoc, {
      score: totalScore + points
    });
    // Trigger pop-out effect
    setIsScorePopped(true);
    setTimeout(() => {
      setIsScorePopped(false);
    }, 300); // Duration matches CSS transition

    console.log('Total Score:', totalScore + points);
    const hisotryDetailsCollection = collection(db, 'genai', userName, 'MyScoring', 'history', 'details');
    // const activityDoc = doc(todoCollection);
    addDoc(hisotryDetailsCollection, {
      activity: activity,
      points: points,
      scoreAfter: totalScore + points,
      timestamp: new Date()
    }).then(() => {
      console.log('Activity logged successfully');
    }).catch((error) => {
      console.error('Error logging activity:', error);
    });
  };

  const showHistory = () => {
    console.log('Show History');
    const hisotryDetailsCollection = collection(db, 'genai', userName, 'MyScoring', 'history', 'details');
    const historyQuery = query(hisotryDetailsCollection, orderBy('timestamp', 'desc'));

    getDocs(historyQuery).then((querySnapshot) => {
      const historyData = [];
      querySnapshot.forEach((doc) => {
        historyData.push(doc.data());
        // console.log(doc.id, ' => ', doc.data());
        console.log('Activity:', doc.data().activity);
        console.log('Score:', doc.data().scoreAfter);
        console.log('Timestamp:', doc.data().timestamp);
      });
      setHistory(historyData);
    }).catch((error) => {
      console.error('Error fetching history:', error);
    });
  };

  return (
    <div>
      <div className="fixed-header">
        <div className="app" style={{ fontSize: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 'bold' }}>
              <img src={`${userName}.png`} alt={userName} style={{ width: '80px', height: '80px', borderRadius: '50%', marginRight: '' }} />  Points :
              <span style={{ fontSize: '38px' }}>  <span className={`score ${isScorePopped ? 'score-popped' : ''}`}>{totalScore}</span>
              </span>
            </div>
            <br />
            <br />
            <br />
          </div>
        </div>
      </div>
      <div className="content">
        <div className="activities">
          {activities.map((activity, index) => (
            <div key={index}>
              <button className="button" onClick={() => handleActivityClick(activity)}>
                {activity}
              </button>
            </div>
          ))}
        </div>
        <br />
        <br />
        {rewards.map((reward, index) => (
          <div key={index}>
            <button className="button reward-button" onClick={() => handleActivityClick(reward)}>
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
            <button className="button punishmentbutton" onClick={() => handleActivityClick(punishment)}>
              {punishment}
            </button>
          </div>
        ))}
      </div>
      <br />
      <br />
      <div>
        <button style={{ fontSize: '29px' }} onClick={() => showHistory()}>
          History of Activities
        </button>
      </div>
      {/* Display History */}
      <div className="history">
        {history.length > 0 ? (
          history.map((item, index) => (
            <div key={index} className="history-item">
              <p><strong>Activity:</strong> {item.activity}</p>
              <p><strong>Score:</strong> {item.scoreAfter}</p>
              <p><strong>Timestamp:</strong> {new Date(item.timestamp.seconds * 1000).toLocaleString()}</p>
            </div>
          ))
        ) : null}
      </div>
    </div>

  )
}


export default App;