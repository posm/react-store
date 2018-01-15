import React from 'react';

import { FloatingContainer } from '../../View';
import { iconNames } from '../../../constants';

import {
    caseInsensitiveSubmatch,
    calcFloatingPositionInMainWindow,
    getRatingForContentInString,
} from '../../../utils/common';

// p => props

export const getClassName = (styles, base, state, p) => {
    const {
        disabled,
        error,
        clearable,
        className,
        value,
    } = p;

    const {
        showOptions,
    } = state;

    const classNames = [className, base, styles[base]];

    if (disabled) {
        classNames.push('disabled');
        classNames.push(styles.disabled);
    }

    if (error) {
        classNames.push('error');
        classNames.push(styles.error);
    }

    if (clearable) {
        classNames.push('clearable');
        classNames.push(styles.clearable);
    }

    if (showOptions) {
        classNames.push('options-shown');
        classNames.push(styles['options-shown']);
    }

    if (value && value.length !== 0) {
        classNames.push('filled');
        classNames.push(styles.filled);
    }

    return classNames.join(' ');
};

export const isOptionActive = (key, values) => values.indexOf(key) !== -1;

export const getOptionClassName = (styles, isActive) => {
    const classNames = ['option', styles.option];

    if (isActive) {
        classNames.push('active');
        classNames.push(styles.active);
    }

    return classNames.join(' ');
};

export const handleInputValueChange = (parent, value) => {
    const {
        options,
        labelSelector,
    } = parent.props;


    const displayOptions = options.filter(option =>
        caseInsensitiveSubmatch(labelSelector(option), value),
    );

    displayOptions.sort((a, b) => (
        getRatingForContentInString(value, labelSelector(a))
        - getRatingForContentInString(value, labelSelector(b))
    ));

    parent.setState({
        displayOptions,
        inputValue: value,
        showOptions: true,
    });
};

export const handleInputClick = (parent) => {
    if (parent.container) {
        // eslint-disable-next-line no-param-reassign
        parent.boundingClientRect = parent.container.getBoundingClientRect();
    }

    if (parent.input) {
        parent.input.select();
    }

    parent.setState({
        displayOptions: parent.props.options,
        showOptions: true,
    });
};

export const getOptionsContainerPosition = (parent, optionsContainer) => {
    const containerRect = optionsContainer.getBoundingClientRect();
    let parentRect = parent.boundingClientRect;
    if (parent.container) {
        parentRect = parent.container.getBoundingClientRect();
    }

    const offset = { top: 2, bottom: 0, left: 0, right: 0 };
    if (parent.props.showHintAndError) {
        offset.top = 12;
    }

    const optionsContainerPosition = (
        calcFloatingPositionInMainWindow(parentRect, containerRect, offset)
    );
    return optionsContainerPosition;
};

export const renderLabel = p => (
    p.showLabel ? (
        <div className={`label ${p.styles.label}`}>
            { p.label }
        </div>
    ) : null
);

export const renderClearButton = p => (
    p.show ? (
        <button
            className={`clear-button ${p.styles['clear-button']}`}
            onClick={p.parent.handleClearButtonClick}
            title="Clear selected option(s)"
            disabled={p.parent.props.disabled}
            type="button"
        >
            <span className={iconNames.close} />
        </button>
    ) : null
);

export const renderHintAndError = (p) => {
    const {
        showHintAndError,
        error,
        hint,
        styles,
    } = p;

    if (!showHintAndError) {
        return null;
    }

    let content;
    if (error) {
        content = <p className={`error ${styles.error}`}>{error}</p>;
    } else if (hint) {
        content = <p className={`hint ${styles.hint}`}>{hint}</p>;
    } else {
        content = <p key="empty" className={`empty ${styles.empty}`}>-</p>;
    }

    return content;
};

export const renderOptions = (p) => {
    const {
        parent,
        styles,
    } = p;

    const {
        showOptions,
        displayOptions,
    } = parent.state;

    if (!showOptions) {
        return null;
    }

    const {
        keySelector,
        renderEmpty: EmptyComponent,
        optionsClassName,
    } = parent.props;

    const Option = parent.renderOption;

    return (
        <FloatingContainer
            onBlur={parent.handleOptionContainerBlur}
            onInvalidate={parent.handleOptionContainerInvalidate}
            parent={parent.container}
            className={`options ${styles.options} ${optionsClassName}`}
        >
            {
                displayOptions.map(option => (
                    <Option
                        key={keySelector(option)}
                        option={option}
                    />
                ))
            }
            {
                displayOptions.length === 0 && (
                    <div className={`empty ${styles.empty}`}>
                        <EmptyComponent />
                    </div>
                )
            }
        </FloatingContainer>
    );
};