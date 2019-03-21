import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from 'mapbox-gl-draw';

import MapChild from '../MapChild';

const propTypes = {
};

const defaultProps = {
};

const emptyObject = {};

@MapChild
export default class MapLayer extends React.PureComponent {
    static propTypes = propTypes;
    static defaultProps = defaultProps;

    componentDidMount() {
        const {
            map,
            options,
        } = this.props;

        this.createDraw(map, options);
        this.attatchEvents(map, this.props, emptyObject, this.props);
    }

    componentWillReceiveProps(nextProps) {
        const {
            map,
            options,
        } = nextProps;
        const { map: prevMap } = this.props;

        if (map !== prevMap) {
            // TODO: incorporate options change as well
            this.createDraw(map, options);
            this.attatchEvents(map, nextProps, this.props, true);
        } else {
            this.attatchEvents(map, nextProps, this.props);
        }
    }

    componentWillUnmount() {
        const { map } = this.props;
        map.removeControl(this.draw);
    }

    createDraw = (map, options) => {
        this.draw = new MapboxDraw(options);
        map.addControl(this.draw);
    }

    attatchEvents = (map, newEventHandlers, prevEventHandlers, force = false) => {
        const {
            onCreate,
            onDelete,
            onUpdate,
        } = newEventHandlers;

        const {
            onCreate: prevOnCreate,
            onDelete: prevOnDelete,
            onUpdate: prevOnUpdate,
        } = prevEventHandlers;

        if (onCreate && (onCreate !== prevOnCreate || force)) {
            map.on('draw.create', onCreate);
        }

        if (onDelete && (onDelete !== prevOnDelete || force)) {
            map.on('draw.delete', onDelete);
        }

        if (onUpdate && (onUpdate !== prevOnUpdate || force)) {
            map.on('draw.update', onUpdate);
        }
    }

    render() {
        return null;
    }
}
