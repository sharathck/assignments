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
let articles = '';
let uid = '';
let total_score = 0;

function App() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [totalScore, setTotalScore] = useState(0);
  const [editTask, setEditTask] = useState(null);
  const [editTaskText, setEditTaskText] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [readerMode, setReaderMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activity10, setActivity10] = useState('Wake Up Fresh and No Nagging');
  const [activity20, setActivity20] = useState('Bath, Dress, Socks, Shoe');
  const [activity30, setActivity30] = useState('LunchBox, Water Bottle, Snack, Folders');
  const [activity40, setActivity40] = useState('Keep School Bag in Room and Lunch Box in Kitchen Sink');
  const [activity50, setActivity50] = useState('Maths');
  const [activity60, setActivity60] = useState('Read');
  const [activity70, setActivity70] = useState('Dishwasher and Clean Bed Room');
  const [activity80, setActivity80] = useState('No Nagging or Crying');
  const [activity90, setActivity90] = useState('Sleep by 9:00 PM');

  const [reward10, setReward10] = useState('100 Points - Screentime (+30 min)');
  const [reward20, setReward20] = useState('100 Points - Toys Time (+30 min)');
  const [reward30, setReward30] = useState('100 Points - Outdoor Play (+30 min)');
  const [reward40, setReward40] = useState('300 Points - No Homework for 1 Day');
  const [reward50, setReward50] = useState('400 Points - Pick Favorite Restaurant');
  const [reward60, setReward60] = useState('500 Points - Play Date with Friends');
  const [reward70, setReward70] = useState('990 Points - Buy a Toy');
  

  const [history, setHistory] = useState([]);
  const [isScorePopped, setIsScorePopped] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      console.log('User:', 'Devansh');
      const todoCollection = collection(db, 'genai', 'Devansh', 'MyScoring');
      const scoreDoc = doc(todoCollection, 'final_score');
      getDoc(scoreDoc).then((doc) => {
        if (doc.exists()) {
          total_score = doc.data().score;
          setTotalScore(total_score);
          console.log('inside Doc Total Score:', total_score);
        } else {
          console.log("No such document!");
        }
      }).catch((error) => {
        console.log("Error getting document:", error);
      });
      console.log('Total Score:', total_score);
    }
  }, [user]);



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

  const handleActivityClick = (activity, points = 10) => {
    setTotalScore(prevScore => prevScore + points);
    const todoCollection = collection(db, 'genai', 'Devansh', 'MyScoring');
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
    const hisotryDetailsCollection = collection(db, 'genai', 'Devansh', 'MyScoring', 'history', 'details');
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
    const hisotryDetailsCollection = collection(db, 'genai', 'Devansh', 'MyScoring', 'history', 'details');
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
      {1 == 1 &&
        <div className="app" style={{ marginBottom: '120px', fontSize: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 'bold' }}>Devansh's Score:
              <div style={{ margin: '20px', fontSize: '38px' }}>  <span className={`score ${isScorePopped ? 'score-popped' : ''}`}>{totalScore}</span>
              </div>
            </div>
            <br />
            <br />
            <br />
          </div>
          <div className="activities">
            <button className='button' onClick={() => handleActivityClick(activity10)}>
              {activity10}
            </button>
          </div>
          <div>
            <button className='button' onClick={() => handleActivityClick(activity20)}>
              {activity20}
            </button>
          </div>
          <div>
            <button className='button' onClick={() => handleActivityClick(activity30)}>
              {activity30}
            </button>
          </div>
          <div>
            <button className='button' onClick={() => handleActivityClick(activity40)}>
              {activity40}
            </button>
          </div>
          <div>
            <button className='button large-font' onClick={() => handleActivityClick(activity50, 30)}>
             +30 Points - {activity50}
            </button>
          </div>
          <div>
            <button className='button large-font' onClick={() => handleActivityClick(activity60, 30)}>
            +30 Points - {activity60}
            </button>
          </div>
          <div>
            <button className='button' onClick={() => handleActivityClick(activity70)}>
              {activity70}
            </button>
          </div>
          <div>
            <button className='button' onClick={() => handleActivityClick(activity80)}>
              {activity80}
            </button>
          </div>
          <div>
            <button className='button' onClick={() => handleActivityClick(activity90)}>
              {activity90}
            </button>
          </div>
          <br />
          <br />
          <br />


          {/* Rewards Section */}
          <div className="rewards" style={{ marginTop: '20px' }}>
            <h2>Rewards</h2>
            <div className="rewards-buttons">
              <div>
                <button
                  className='button reward-button'
                  onClick={() => handleActivityClick(reward10, -100)}
                >
                  {reward10}
                </button>
              </div>
              <div>
                <button
                  className='button reward-button'
                  onClick={() => handleActivityClick(reward20, -100)}
                >
                  {reward20}
                </button>
              </div>
              <div>
                <button
                  className='button reward-button'
                  onClick={() => handleActivityClick(reward30, -100)}
                >
                  {reward30}
                </button>
              </div>
              <div>
                <button
                  className='button reward-button'
                  onClick={() => handleActivityClick(reward40, -300)}
                >
                  {reward40}
                </button>
              </div>
              <div>
                <button
                  className='button reward-button'
                  onClick={() => handleActivityClick(reward50, -400)}
                >
                  {reward50}
                </button>
              </div>
              <div>
                <button
                  className='button reward-button'
                  onClick={() => handleActivityClick(reward60, -500)}
                >
                  {reward60}
                </button>
              </div>
              <div>
                <button
                  className='button reward-button'
                  onClick={() => handleActivityClick(reward70, -990)}
                >
                  {reward70}
                </button>
              </div>
            </div>
          </div>

          <br />
          <br />
          <button
              onClick={() => handleActivityClick('Bad behavior : 10 Points', -10)}
              style={{
                backgroundColor: 'lightcoral',
                fontSize : '22px',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                marginRight: '10px',
                cursor: 'pointer',
                borderRadius: '5px'
              }}
            >
              Bad behavior : 10 Points
            </button>
            <br />
            <br />
            <br />
          <div>
            <button style = {{fontSize : '25px'}} onClick={() => showHistory()}>
              History of Activities
            </button>
          </div>
          {/* Display History */}
          <div className="history">
            {history.length > 0 ? (
              history.map((item, index) => (
                <div key={index} className="history-item">
                  <p><strong>Activity:</strong> {item.activity}</p>
                  <p><strong>Points:</strong> {item.points}</p>
                  <p><strong>Score:</strong> {item.scoreAfter}</p>
                  <p><strong>Timestamp:</strong> {new Date(item.timestamp.seconds * 1000).toLocaleString()}</p>
                </div>
              ))
            ) : (
              <p></p>
            )}
          </div>
        </div>
      }
      {!user && 1 == 2 && <div style={{ fontSize: '22px', width: '100%', margin: '0 auto' }}>
        <br />
        <br />
        <p>Sign In</p>
        <input
          className='textinput'
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <br />
        <br />
        <input
          type="password"
          className='textinput'
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <br />
        <br />
        <button className='signonpagebutton' onClick={() => handleSignInWithEmail()}>Sign In</button>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        <button className='signuppagebutton' onClick={() => handleSignUpWithEmail()}>Sign Up</button>
        <br />
        <br />
        <button onClick={() => handlePasswordReset()}>Forgot Password?</button>
        <br />
        <br />
        <button className='signonpagebutton' onClick={() => handleSignIn()}>Sign In with Google</button>
        <br />
      </div>}
    </div>
  )
}


export default App;