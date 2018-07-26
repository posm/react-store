import PropTypes from 'prop-types';
import React from 'react';

import {
    addClassName,
    removeClassName,
} from '../../../../utils/common';

import styles from './styles.scss';

const propTypes = {
    className: PropTypes.string,
    datum: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
    layoutSelector: PropTypes.func.isRequired,
    layoutValidator: PropTypes.func.isRequired,
    headerModifier: PropTypes.func.isRequired,
    contentModifier: PropTypes.func.isRequired,
    $itemKey: PropTypes.string.isRequired,
    onLayoutChange: PropTypes.func.isRequired,
};

const defaultProps = {
    className: '',
};


export default class GridItem extends React.PureComponent {
    static propTypes = propTypes;
    static defaultProps = defaultProps;

    constructor(props) {
        super(props);

        const {
            datum,
            layoutSelector,
        } = props;

        this.state = {
            layout: layoutSelector(datum),
        };

        this.containerRef = React.createRef();
        this.isMouseDown = false;
    }

    componentWillMount() {
        window.addEventListener('mouseup', this.handleMouseUp);
    }

    componentWillReceiveProps(nextProps) {
        const {
            layoutSelector: oldLayoutSelector,
            datum: oldDatum,
        } = this.props;

        const {
            layoutSelector: newLayoutSelector,
            datum: newDatum,
        } = nextProps;

        if (oldLayoutSelector !== newLayoutSelector || oldDatum !== newDatum) {
            this.setState({ layout: newLayoutSelector(newDatum) });
        }
    }

    componentWillUnmount() {
        window.removeEventListener('mouseup', this.handleMouseUp);
        window.removeEventListener('mousemove', this.handleMouseMove);
    }

    handleMouseDown = (e) => {
        this.lastScreenX = e.screenX;
        this.lastScreenY = e.screenY;

        const { current: container } = this.containerRef;
        addClassName(container, styles.moving);

        window.addEventListener('mousemove', this.handleMouseMove);
        this.isMouseDown = true;
    }

    handleMouseUp = (e) => {
        if (!this.isMouseDown) {
            return;
        }

        this.isMouseDown = false;

        this.lastScreenX = e.screenX;
        this.lastScreenY = e.screenY;

        const { current: container } = this.containerRef;
        removeClassName(container, styles.moving);

        window.removeEventListener('mousemove', this.handleMouseMove);

        if (this.isLayoutValid) {
            const {
                onLayoutChange,
                $itemKey,
            } = this.props;

            const { layout } = this.state;

            onLayoutChange($itemKey, layout);
        } else {
            const {
                layoutSelector,
                datum,
            } = this.props;

            const oldLayout = layoutSelector(datum);
            this.setState({ layout: oldLayout });

            this.isLayoutValid = true;
            removeClassName(container, styles.invalid);
        }
    }

    handleMouseMove = (e) => {
        const dx = e.screenX - this.lastScreenX;
        const dy = e.screenY - this.lastScreenY;

        this.lastScreenX = e.screenX;
        this.lastScreenY = e.screenY;

        const { layout } = this.state;
        const newLayout = {
            ...layout,
            left: layout.left + dx,
            top: layout.top + dy,
        };

        this.setState({
            layout: newLayout,
        });

        const {
            layoutValidator: isLayoutValid,
            $itemKey,
        } = this.props;
        const { current: container } = this.containerRef;

        if (isLayoutValid($itemKey, newLayout)) {
            this.isLayoutValid = true;
            removeClassName(container, styles.invalid);
        } else {
            this.isLayoutValid = false;
            addClassName(container, styles.invalid);
        }
    }

    renderHeader = () => {
        const {
            datum,
            headerModifier,
        } = this.props;

        return headerModifier(datum);
    }

    renderContent = () => {
        const {
            datum,
            contentModifier,
        } = this.props;

        return contentModifier(datum);
    }

    render() {
        const { className: classNameFromProps } = this.props;
        const { layout } = this.state;

        const className = `
            ${classNameFromProps}
            grid-item
            ${styles.gridItem}
        `;

        const Header = this.renderHeader;
        const Content = this.renderContent;

        const style = {
            width: layout.width,
            height: layout.height,
            transform: `translate(${layout.left}px, ${layout.top}px)`,
        };

        return (
            // eslint-disable-next-line jsx-a11y/no-static-element-interactions
            <div
                className={className}
                ref={this.containerRef}
                style={style}
                onMouseDown={this.handleMouseDown}
                onMouseUp={this.handleMouseUp}
            >
                <Header />
                <Content />
            </div>
        );
    }
}