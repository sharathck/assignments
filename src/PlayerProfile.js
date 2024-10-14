import React from 'react';
import './PlayerProfile.css'; // Import the CSS for styling

const PlayerProfile = () => {
    // Array of player profiles with sample names and unique ratings
    const players = [
        {
            name: 'Aarush K',
            image: 'Aarush.png',
            ratings: {
                speed: 95,
                stamina: 100,
                striking: 50,
                defense: 100,
                strategy: 100,
                passing: 65,
                receiving: 80,
                goalie: 25,
            },
        },
        {
            name: 'Devansh K',
            image: 'Devansh.png',
            ratings: {
                speed: 50,
                stamina: 60,
                striking: 35,
                defense: 55,
                strategy: 60,
                passing: 70,
                receiving: 65,
                goalie: 55,
            },
        },
        {
            name: 'Vivaan',
            image: 'Vivaan.png',
            ratings: {
                speed: 100,
                stamina: 100,
                striking: 40,
                defense: 90,
                strategy: 45,
                passing: 85,
                receiving: 60,
                goalie: 95,
            },
        },
        {
            name: 'Srihith K',
            image: 'Srihith.png',
            ratings: {
                speed: 45,
                stamina: 45,
                striking: 30,
                defense: 55,
                strategy: 30,
                passing: 40,
                receiving: 45,
                goalie: 35,
            },
        },
        {
            name: 'burok',
            ratings: {
                speed: 95,
                stamina: 95,
                striking: 100,
                defense: 95,
                strategy: 50,
                passing: 75,
                receiving: 80,
                goalie: 95,
            },
        },
        {
            name: 'bara',
            ratings: {
                speed: 95,
                stamina: 95,
                striking: 95,
                defense: 50,
                strategy: 10,
                passing: 10,
                receiving: 45,
                goalie: 100,
            },
        },
    ];

    const calculateAverageRating = (ratings) => {
        const values = Object.values(ratings);
        return values.reduce((a, b) => a + b, 0) / values.length;
    };

    return (
        <div className="profile-container">
            <div className="grid-container">
                {players.map((player, index) => (
                    <div key={index} className="player-profile">
                        <span className="player-name">{player.name}</span>
                        &nbsp;&nbsp;&nbsp;
                        {player.image && (
                            <img
                                src={`./${player.image}`}
                                alt={`${player.name}`}
                                className="player-image"
                                style={{ width: '80px', height: '80px' }} // Small thumbnail size
                            />
                        )}
                        <div>
                            {Object.keys(player.ratings).map((key) => (
                                <div className="rating-bar" key={key}>
                                    <div
                                        className="rating-fill"
                                        style={{ width: `${player.ratings[key]}%` }}
                                    >
                                   {key.charAt(0).toUpperCase() + key.slice(1)}
                                   &nbsp; &nbsp;
                                   <strong>{player.ratings[key]}</strong>
                                    </div>
                                </div>
                            ))}
                            <div className="average">
                                
                                <div className="rating-bar">
                                <span>Average</span>
                                    <span
                                        className="average-rating-fill"
                                        style={{
                                            width: `${calculateAverageRating(player.ratings)}%`
                                        }}
                                    > &nbsp; &nbsp;
                                    <strong>{calculateAverageRating(player.ratings).toFixed(1)}</strong>
                                    </span>
                                    </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PlayerProfile;