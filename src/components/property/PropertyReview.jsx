import React from 'react';
import { withRouter } from 'react-router-dom';

class PropertyReview extends React.Component {
    getRatingString(rating) {
        let result = "";
        let ratingRoundedNumber = Math.round(rating);

        if (ratingRoundedNumber === 5) {
            result += "Excellent";
        }
        else if (ratingRoundedNumber === 4) {
            result += "Very good";
        }
        else if (ratingRoundedNumber === 3) {
            result += "Good";
        }
        else if (ratingRoundedNumber === 2) {
            result += "Sufficient";
        }
        else if (ratingRoundedNumber === 1) {
            result += "Weak";
        }
        else if (ratingRoundedNumber === 0) {
            result += "Poor"
        }
        result += ' ';
        result += Math.round(rating * 100) / 100 + '/5';
        return result;
    }

    getStars(rating) {
        let starsElements = [];
        let rounded = Math.round(rating);
        for (let i = 0; i < rounded; i++) {
            starsElements.push(<span key={i} className="full-star" />);
        }
        for (let i = 0; i < 5 - rounded; i++) {
            starsElements.push(<span key={100 - i} className="empty-star" />);
        }

        return starsElements;
    }

    render() {
        return (
            <div className="list-hotel-rating">
                <div className="list-hotel-rating-count">{this.getRatingString(this.props.rating)}</div>
                <div className="list-hotel-rating-stars">
                    {this.getStars(this.props.rating)}
                </div>
                <p className="list-hotel-rating-review">{this.props.reviewText}</p>
            </div>
        )
    }
}

export default withRouter(PropertyReview);