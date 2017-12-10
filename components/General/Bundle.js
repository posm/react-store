import React from 'react';
import PropTypes from 'prop-types';

const propTypes = {
    load: PropTypes.func.isRequired,
};

class Bundle extends React.Component {
    static propTypes = propTypes;

    constructor(props) {
        super(props);
        this.state = { Component: null };
    }

    componentWillMount() {
        this.setState({
            Component: null,
        });

        this.props.load()
            .then((Component) => {
                this.setState({
                    Component: Component.default ? Component.default : Component,
                });
            });
    }

    render() {
        const {
            // prevent load from entering component
            load, // eslint-disable-line
            ...otherProps
        } = this.props;
        const { Component } = this.state;
        return Component ? <Component {...otherProps} /> : null;
    }
}

export default Bundle;
