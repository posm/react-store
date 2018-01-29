import CSSModules from 'react-css-modules';
import PropTypes from 'prop-types';
import React from 'react';
import { SketchPicker } from 'react-color';

import styles from './styles.scss';
import {
    FloatingContainer,
} from '../../View';
import {
    randomString,
    calcFloatingPositionInMainWindow,
} from '../../../utils/common';

const propTypes = {
    /**
     * for styling by styleName
     */
    className: PropTypes.string,

    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
    ]),

    /**
     * String to show in case of error
     */
    error: PropTypes.string,

    /**
     * Hint text
     */
    hint: PropTypes.string,

    /**
     * A callback for when the input changes its content
     */
    onChange: PropTypes.func.isRequired,

    /**
     * label for the checkbox
     */
    label: PropTypes.node.isRequired,

    showLabel: PropTypes.bool,

    showHintAndError: PropTypes.bool,
};

const defaultProps = {
    className: '',
    showLabel: true,
    value: undefined,
    error: '',
    hint: '',
    showHintAndError: true,
};

@CSSModules(styles, { allowMultiple: true })
export default class ColorInput extends React.PureComponent {
    static propTypes = propTypes;
    static defaultProps = defaultProps;

    constructor(props) {
        super(props);
        this.state = {
            showColorPicker: false,
        };

        this.inputId = randomString();
        this.boundingClientRect = {};
    }

    handleColorPickerInvalidate = (colorPickerContainer) => {
        const containerRect = colorPickerContainer.getBoundingClientRect();
        let parentRect = this.boundingClientRect;
        if (this.container) {
            parentRect = this.container.getBoundingClientRect();
        }

        const offset = { top: 2, right: 0, bottom: 0, left: 0 };
        if (this.props.showHintAndError) {
            offset.top = 12;
        }

        const optionsContainerPosition = (
            calcFloatingPositionInMainWindow(parentRect, containerRect, offset)
        );
        return optionsContainerPosition;
    }

    handleInputChange = (e) => {
        const value = e.target.checked;
        this.props.onChange(value);
    }

    handleColorBoxClick = () => {
        this.boundingClientRect = this.container.getBoundingClientRect();
        this.setState({ showColorPicker: true });
    }

    handleCloseColorPickerClick = () => {
        this.setState({ showColorPicker: false });
    }

    handleColorChange = (newColor) => {
        if (this.props.onChange) {
            this.props.onChange(newColor.hex);
        }
    }

    handleColorPickerBlur = () => {
        this.setState({ showColorPicker: false });
    }

    render() {
        const {
            label,
            className,
            value,
            showLabel,
            showHintAndError,
            error,
            hint,
        } = this.props;

        const {
            showColorPicker,
        } = this.state;

        return (
            <div
                styleName="color-input"
                className={className}
                ref={(el) => { this.container = el; }}
            >
                {
                    showLabel && (
                        <div
                            className="label"
                            styleName="label"
                        >
                            {label}
                        </div>
                    )
                }
                <button
                    styleName="color-box"
                    className="color-box"
                    onClick={() => this.handleColorBoxClick()}
                >
                    <span
                        styleName="color"
                        className="color"
                        style={{ backgroundColor: value }}
                    />
                </button>
                {
                    showHintAndError && [
                        !error && hint && (
                            <p
                                key="hint"
                                className="hint"
                                styleName="hint"
                            >
                                {hint}
                            </p>
                        ),
                        error && !hint && (
                            <p
                                key="error"
                                styleName="error"
                                className="error"
                            >
                                {error}
                            </p>
                        ),
                        !error && !hint && (
                            <p
                                key="empty"
                                styleName="empty"
                                className="error empty"
                            >
                                -
                            </p>
                        ),
                    ]
                }
                {
                    showColorPicker && (
                        <FloatingContainer
                            parent={this.container}
                            onBlur={this.handleColorPickerBlur}
                            onInvalidate={this.handleColorPickerInvalidate}
                        >
                            <SketchPicker
                                color={value}
                                onChange={this.handleColorChange}
                            />
                        </FloatingContainer>
                    )
                }
            </div>
        );
    }
}