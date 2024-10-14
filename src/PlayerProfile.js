import React from 'react';
import './PlayerProfile.css'; // Import the CSS for styling

const PlayerProfile = () => {
    // Sample ratings for the player
    const ratings = {
        speed: 80,
        stamina: 90,
        striking: 85,
        defense: 75,
        strategy: 88,
        passing: 92,
        receiving: 84,
        goalie: 70
    };

    const averageRating = Object.values(ratings).reduce((a, b) => a + b) / Object.values(ratings).length;

    return (
        <div className="profile-container">
            <h2 className="player-name">Aarush Kammari</h2>
            <div >
                {Object.keys(ratings).map((key) => (
                    <div className="rating-bar" key={key}>
                        <h4>{key.charAt(0).toUpperCase() + key.slice(1)}</h4>
                            <div
                                className="rating-fill"
                                style={{ width: `${ratings[key]}%`, backgroundColor: 'red' }}
                            >{ratings[key]}</div>
                    </div>
                ))}
                <div className="rating-box average">
                    <h4>Average</h4>
                    <div className="rating-bar">
                        <div
                            className="rating-fill"
                            style={{ width: `${averageRating}%`, backgroundColor: 'red' }}
                        ></div>
                    </div>
                    <div className="rating-value">{averageRating.toFixed(1)}</div>
                </div>
            </div>
        </div>
    );
};

export default PlayerProfile;