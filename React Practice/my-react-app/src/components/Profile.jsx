// Filename - Profile.js

import { useParams } from "react-router-dom";

export default function Profile(props) {
    const { userName } = useParams();

    return (
        <div>
            <h1> Profile of {userName}</h1>

            <p> This is the profile page of {userName}</p>
        </div>
    );
}