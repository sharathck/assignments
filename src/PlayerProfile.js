import React from 'react';
import './PlayerProfile.css'; // Import the CSS for styling

const PlayerProfile = () => {
    // Array of player profiles with sample names and unique ratings
    const players = [
        {
            name: 'Aarush K',
            image: 'Aarush.png',
            ratings: {
                speed: 80,
                stamina: 90,
                striking: 85,
                defense: 75,
                strategy: 88,
                passing: 92,
                receiving: 84,
                goalie: 70,
            },
        },
        {
            name: 'Devansh K',
            image: 'Devansh.png',
            ratings: {
                speed: 75,
                stamina: 85,
                striking: 80,
                defense: 70,
                strategy: 82,
                passing: 88,
                receiving: 79,
                goalie: 68,
            },
        },
        {
            name: 'Jane Smith',
            ratings: {
                speed: 85,
                stamina: 92,
                striking: 90,
                defense: 80,
                strategy: 91,
                passing: 95,
                receiving: 87,
                goalie: 72,
            },
        },
        {
            name: 'Bob Johnson',
            ratings: {
                speed: 78,
                stamina: 88,
                striking: 82,
                defense: 74,
                strategy: 85,
                passing: 90,
                receiving: 81,
                goalie: 66,
            },
        },
        {
            name: 'Alice Williams',
            ratings: {
                speed: 82,
                stamina: 89,
                striking: 84,
                defense: 76,
                strategy: 87,
                passing: 91,
                receiving: 83,
                goalie: 69,
            },
        },
        {
            name: 'Mike Brown',
            ratings: {
                speed: 80,
                stamina: 86,
                striking: 83,
                defense: 73,
                strategy: 84,
                passing: 89,
                receiving: 80,
                goalie: 67,
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