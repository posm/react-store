import CSSModules from 'react-css-modules';
import PropTypes from 'prop-types';
import React from 'react';

import RawTable from '../RawTable';
import ColumnHeader from './ColumnHeader';
import styles from './styles.scss';

import {
    isEqualAndTruthy,
    isFalsy,
} from '../../../utils/common';

const propTypeKey = PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
]);

/**
 * comparator: comparator function for sorting, recieves data rows(not column data)
 *
 * defaultSortOrder: the sort order which should be applied when clicked,
 *
 * key: unique key for each column, the key is also used to determine
 *      the data for rows in the body
 *
 * label: text label for the column
 *
 * modifier: returns a renderable object for the column, recieves whole row of data (not column)
 *
 * order: the order in which they appear relative to that of other header columns
 *
 * sortable: is element sortable?
 */
const TableHeaderPropTypes = PropTypes.arrayOf(
    PropTypes.shape({
        comparator: PropTypes.func,
        defaultSortOrder: PropTypes.string,
        key: PropTypes.string,
        label: PropTypes.string,
        modifier: PropTypes.func,
        order: PropTypes.number,
        sortable: PropTypes.bool,
    }),
);

const TableDataPropTypes = PropTypes.arrayOf(
    PropTypes.shape({
        key: PropTypes.string,
        // Note: Shape is dynamic
    }).isRequired,
);

const propTypes = {
    className: PropTypes.string,

    /**
     * data for table rows
     *
     * NOTE: see { TableDataPropTypes } in Table/Body for more detail
     */
    data: TableDataPropTypes.isRequired,

    /**
     * An object with header key, order(ASC/DSC) for the default sort
     */
    defaultSort: PropTypes.shape({
        key: PropTypes.string.isRequired,
        order: PropTypes.string.isRequired,
    }),

    /**
     * headers is an array of the structure objects required for the header
     *
     * NOTE: see { TableHeaderPropTypes } in Table/Header for more detail
     */
    headers: TableHeaderPropTypes.isRequired,

    /**
     * A function that returns key from the row data
     */
    keyExtractor: PropTypes.func.isRequired,

    highlightCellKey: PropTypes.shape({
        columnKey: propTypeKey,
        rowKey: propTypeKey,
    }),

    highlightColumnKey: propTypeKey,

    highlightRowKey: propTypeKey,

    onBodyClick: PropTypes.func,

    onDataSort: PropTypes.func,
};

const defaultProps = {
    className: '',
    defaultSort: undefined,

    highlightCellKey: {},
    highlightColumnKey: undefined,
    highlightRowKey: undefined,
    onBodyClick: undefined,
    onDataSort: undefined,
};

const isArrayEqual = (array1, array2) => (
    array1.length === array2.length && array1.every((d, i) => d === array2[i])
);

@CSSModules(styles, { allowMultiple: true })
export default class Table extends React.PureComponent {
    static propTypes = propTypes;
    static defaultProps = defaultProps;

    constructor(props) {
        super(props);

        const {
            headers,
            data,
            defaultSort,
        } = this.props;

        let activeSort = defaultSort;

        // Get activeSort if there is no defaultSort
        if (!activeSort) {
            activeSort = this.getActiveSort(headers);
        }

        const newHeaders = this.getStateHeaders(headers, activeSort);

        // initially sort the data
        const newData = this.getSortedData(headers, data, activeSort);

        this.state = {
            activeSort,
            headers: newHeaders,
            data: newData,
        };
    }

    componentWillReceiveProps(nextProps) {
        const {
            data: nextData,
            headers: nextHeaders,
            defaultSort: nextDefaultSort,
        } = nextProps;
        let {
            data: newData,
            headers: newHeaders,
        } = this.props;
        const {
            data: stateData,
        } = this.state;

        const headersChanged = !isArrayEqual(nextHeaders, newHeaders);
        // NOTE: This is necessary
        if (headersChanged) {
            newHeaders = nextHeaders;
        }

        // To be set in state
        let { activeSort: newActiveSort } = this.state;

        // Determine new active sort
        // Priority: state > nextDefaultSort > first sortable header
        if (isFalsy(newActiveSort.key)) {
            newActiveSort = nextDefaultSort || this.getActiveSort(newHeaders);
        }

        newHeaders = this.getStateHeaders(newHeaders, newActiveSort);

        const dataChanged = !isArrayEqual(nextData, newData);
        if (dataChanged || headersChanged) {
            newData = this.getSortedData(nextHeaders, nextData, newActiveSort);
        } else {
            newData = stateData;
        }

        this.setState({
            activeSort: newActiveSort,
            data: newData,
            headers: newHeaders,
        });
    }

    // eslint-disable-next-line react/sort-comp
    handleHeaderClick = (key) => {
        const clickedHeader = this.state.headers.find(d => d.key === key);
        if (!clickedHeader) {
            console.error(`Header with key '${key}' not found`);
        }
        if (!clickedHeader || !clickedHeader.sortable) {
            return;
        }

        let { activeSort: newActiveSort } = this.state;
        if (newActiveSort.key === key) {
            newActiveSort = {
                ...newActiveSort,
                order: newActiveSort.order === 'asc' ? 'dsc' : 'asc',
            };
        } else {
            newActiveSort = {
                key,
                order: clickedHeader.defaultSortOrder || 'asc',
            };
        }

        const newHeaders = this.getStateHeaders(this.state.headers, newActiveSort);

        const newData = this.getSortedData(newHeaders, this.props.data, newActiveSort);

        this.setState({
            activeSort: newActiveSort,
            data: newData,
            headers: newHeaders,
        });
    }

    getActiveSort = (newHeaders) => {
        const sortableHeaders = newHeaders.filter(d => d.sortable);

        let newActiveSort = {};
        if (sortableHeaders && sortableHeaders.length > 0) {
            newActiveSort = {
                key: sortableHeaders[0].key,
                order: sortableHeaders[0].defaultSortOrder || 'asc',
            };
        }
        return newActiveSort;
    };

    // add isActiveSort and currentSortOrder in headers
    getStateHeaders = (headers, activeSort) => headers.map(header => ({
        ...header,
        isActiveSort: isEqualAndTruthy(header.key, activeSort.key),
        currentSortOrder: isEqualAndTruthy(header.key, activeSort.key) ? activeSort.order : '',
    }));

    getSortedData = (headers, data, activeSort) => {
        if (isFalsy(activeSort) || !activeSort.key) {
            return data;
        }

        const activeHeader = headers.find(header => header.key === activeSort.key);

        if (!activeHeader) {
            return data;
        }

        const sortByHeader = (a, b) => (
            (activeSort.order === 'dsc' ? -1 : 1) * activeHeader.comparator(a, b)
        );

        const newData = [...data].sort(sortByHeader);
        return newData;
    }

    dataModifier = (data, columnKey) => {
        const header = this.state.headers.find(d => d.key === columnKey);

        if (header.modifier) {
            return header.modifier(data);
        }

        return data[columnKey];
    }

    headerModifier = (header) => {
        const { activeSort } = this.state;
        let active = false;
        let sortOrder = '';

        if (activeSort.key === header.key) {
            active = true;
            sortOrder = activeSort.order;
        }

        return (
            <ColumnHeader
                label={header.label}
                active={active}
                sortOrder={sortOrder}
                sortable={header.sortable}
            />
        );
    }

    render() {
        const {
            className,
            keyExtractor,
            highlightCellKey,
            highlightRowKey,
            highlightColumnKey,
            onBodyClick,
            onDataSort,
        } = this.props;

        const {
            data,
            headers,
        } = this.state;

        return (
            <RawTable
                className={className}
                data={data}
                dataModifier={this.dataModifier}
                headerModifier={this.headerModifier}
                headers={headers}
                keyExtractor={keyExtractor}
                onHeaderClick={this.handleHeaderClick}
                styleName="table"
                highlightCellKey={highlightCellKey}
                highlightRowKey={highlightRowKey}
                highlightColumnKey={highlightColumnKey}
                onBodyClick={onBodyClick}
                onDataSort={onDataSort}
            />
        );
    }
}