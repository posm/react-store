import React from 'react';
import PropTypes from 'prop-types';
import memoize from 'memoize-one';
import {
    isDefined,
    sum,
    randomString,
} from '@togglecorp/fujs';

import ListView from '../List/ListView';
import VirtualizedListView from '../VirtualizedListView';

import Header from './Header';
import Row from './Row';
import styles from './styles.scss';

const propTypes = {
    className: PropTypes.string,
    rowClassName: PropTypes.string,
    headClassName: PropTypes.string,

    data: PropTypes.array, // eslint-disable-line react/forbid-prop-types
    columns: PropTypes.array.isRequired, // eslint-disable-line react/forbid-prop-types
    keySelector: PropTypes.func.isRequired,
    settings: PropTypes.object, // eslint-disable-line react/forbid-prop-types
};

const defaultProps = {
    className: '',
    rowClassName: '',
    headClassName: '',
    data: [],
    columns: [],
    settings: {},
};

const MAX_IDLE_TIMEOUT = 200;

const getVirtualizedRenderParams = (
    columns,
    scrollOffset,
    width,
    itemWidths,
) => {
    let i = 0;
    let startX = 0;
    let startIndex;

    for (; i < columns.length; i += 1) {
        const newStartX = startX + itemWidths[columns[i].key];
        startIndex = i;

        if (scrollOffset < newStartX) {
            break;
        }

        startX = newStartX;
    }

    let endIndex = startIndex;
    let endX = startX;

    for (; i < columns.length; i += 1) {
        const newEndX = endX + itemWidths[columns[i].key];
        endIndex = i;
        endX = newEndX;

        // NOTE: 10px to accomodate the scrollbar
        if ((width + (scrollOffset - 10)) < newEndX) {
            break;
        }
    }

    return {
        startIndex,
        endIndex,
        startX,
        endX,
    };
};

const emptyObject = {};

export default class Taebul extends React.PureComponent {
    static propTypes = propTypes;
    static defaultProps = defaultProps;

    static columnKeySelector = column => column.key;

    constructor(props) {
        super(props);

        this.state = {
            scrollLeft: 0,
        };

        const rand = randomString();
        this.localContainerId = `taebul-container-${rand}`;
        this.localHeadId = `taebul-head-${rand}`;
        this.localBodyId = `taebul-body-${rand}`;
    }

    componentDidMount() {
        window.addEventListener('scroll', this.handleScroll, true);
        this.calculateRowVirtualizationParams(this.props, this.state.scrollLeft);
    }

    componentWillReceiveProps(nextProps) {
        const { scrollLeft } = this.state;
        this.calculateRowVirtualizationParams(nextProps, scrollLeft);
    }

    componentWillUnmount() {
        window.removeEventListener('scroll', this.handleScroll, true);
    }

    getTotalWidth = memoize((columns, columnWidths, defaultColumnWidth) => {
        const definedColumnWidthList = Object.values(columnWidths).filter(isDefined);
        const definedColumnWidthSum = sum(definedColumnWidthList);

        const defaultColumnWidthSum = (columns.length - definedColumnWidthList.length)
            * defaultColumnWidth;

        return defaultColumnWidthSum + definedColumnWidthSum;
    })


    getItemWidths = memoize((
        columns,
        columnWidths,
        defaultColumnWidth,
    ) => {
        const itemWidths = {};
        columns.forEach((c) => {
            itemWidths[c.key] = isDefined(columnWidths[c.key])
                ? columnWidths[c.key]
                : defaultColumnWidth;
        });

        return itemWidths;
    })

    calculateRowVirtualizationParams = ({
        data,
        columns,
        settings: {
            columnWidths = emptyObject,
            defaultColumnWidth,
        },
        keySelector,
    }, scrollLeft) => {
        const rowWidth = this.getTotalWidth(
            columns,
            columnWidths,
            defaultColumnWidth,
        );

        const itemWidths = this.getItemWidths(
            columns,
            columnWidths,
            defaultColumnWidth,
        );

        const container = document.getElementById(this.localContainerId);
        let containerBCR = {};

        if (container) {
            containerBCR = container.getBoundingClientRect();
        }

        const virtualizedRenderParams = getVirtualizedRenderParams(
            columns,
            scrollLeft,
            containerBCR.width,
            itemWidths,
        );

        this.containerScrollLeft = scrollLeft;
        this.rowStartIndex = virtualizedRenderParams.startIndex;
        this.rowEndIndex = virtualizedRenderParams.endIndex;
        this.rowStartVirtualContainerWidth = virtualizedRenderParams.startX;
        this.rowEndVirtualContainerWidth = Math.max(0, rowWidth - virtualizedRenderParams.endX);
    }

    handleScroll = ({ target }) => {
        if (!target.id) {
            return;
        }
        if (target.id === this.localBodyId) {
            const head = document.getElementById(this.localHeadId);

            if (head) {
                head.scrollLeft = target.scrollLeft;

                window.cancelIdleCallback(this.idleCallback);
                this.idleCallback = window.requestIdleCallback(() => {
                    this.calculateRowVirtualizationParams(this.props, target.scrollLeft);
                    this.setState({ scrollLeft: target.scrollLeft });
                }, { timeout: MAX_IDLE_TIMEOUT });
            }
        } else if (target.id === this.localHeadId) {
            const body = document.getElementById(this.localBodyId);

            if (body) {
                body.scrollLeft = target.scrollLeft;

                window.cancelIdleCallback(this.idleCallback);
                this.idleCallback = window.requestIdleCallback(() => {
                    this.calculateRowVirtualizationParams(this.props, target.scrollLeft);
                    this.setState({ scrollLeft: target.scrollLeft });
                }, { timeout: MAX_IDLE_TIMEOUT });
            }
        }
    }

    headerRendererParams = (columnKey, column) => {
        const { data, settings } = this.props;
        const {
            headerRenderer,
            headerRendererParams,
        } = column;

        return {
            columnKey,
            column,
            data,
            renderer: headerRenderer,
            rendererParams: headerRendererParams,
            settings,
        };
    }

    rowRendererParams = (datumKey, datum) => {
        const {
            columns,
            settings,
        } = this.props;

        return {
            datum,
            datumKey,
            columnKeySelector: Taebul.columnKeySelector,
            columns,
            settings,
            containerScrollLeft: this.containerScrollLeft,
            startVirtualContainerWidth: this.rowStartVirtualContainerWidth,
            endVirtualContainerWidth: this.rowEndVirtualContainerWidth,
            startIndex: this.rowStartIndex,
            endIndex: this.rowEndIndex,
        };
    }

    render() {
        const {
            data,
            columns,
            keySelector,
            className: classNameFromProps,
            rowClassName: rowClassNameFromProps,
            headClassName: headClassNameFromProps,
        } = this.props;

        const className = `${styles.taebul} ${classNameFromProps}`;
        const rowClassName = `${styles.row} ${rowClassNameFromProps}`;
        const headClassName = `${styles.head} ${headClassNameFromProps}`;

        return (
            <div
                id={this.localContainerId}
                className={className}
            >
                <ListView
                    id={this.localHeadId}
                    className={headClassName}
                    data={columns}
                    keySelector={Taebul.columnKeySelector}
                    renderer={Header}
                    rendererParams={this.headerRendererParams}
                />
                <VirtualizedListView
                    id={this.localBodyId}
                    className={styles.body}
                    data={data}
                    keySelector={keySelector}
                    renderer={Row}
                    rendererParams={this.rowRendererParams}
                    rendererClassName={rowClassName}
                />
            </div>
        );
    }
}
