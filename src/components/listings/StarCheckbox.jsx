import React from 'react';
import { withRouter } from 'react-router-dom';

class StarCheckbox extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div>
                <span className={`star${this.props.checked ? ' active' : ''}`}>
                    {this.props.text}
                </span>
            </div>
        );
    }
}

export default withRouter(StarCheckbox);