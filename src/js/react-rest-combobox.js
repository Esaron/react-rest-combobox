const $ = require('jquery');
const React = require('react');
const FormControl = require('react-bootstrap/lib/FormControl');
const MenuItem = require('react-bootstrap/lib/MenuItem');
const Dropdown = require('react-bootstrap/lib/Dropdown');
const Link = require('esaron-react-link');

const ComboBoxMenu = React.createClass({
    render: function() {
        return (
            <div id={this.props.id} className="dropdown-menu" style={{ padding: '' }}>
                <ul className="list-unstyled">
                    {this.props.menuItems}
                </ul>
            </div>
        );
    }
});

module.exports = React.createClass({
    onChange: function(e) {
        var t = this;
        clearTimeout(t.state.timer);
        var populateMenu;
        var menuItems = [];
        var value = e.target.value;
        // We only want to grab potential matches at minChars characters
        if (value.length >= t.props.minChars) {
            populateMenu = function() {
                if (!!t.state.currentRequest) {
                    t.state.currentRequest.abort();
                }
                t.setState({'loading': true});
                t.state.currentRequest = $.get(t.props.restUrl, t.props.queryFcn(value), function (data) {
                    var itemData = $.parseJSON(data);
                    $.each(itemData, function (idx, item) {
                        var itemKey = t.props.id + "-" + idx;
                        var formattedItem = t.props.formatFcn(item);
                        menuItems.push(
                            <MenuItem key={itemKey} id={itemKey} eventKey={idx} onSelect={function() {
                                t.props.onSelect(item);
                                t.setState({
                                    'isOpen': false,
                                    'value': formattedItem
                                });
                            }}>
                                {formattedItem}
                            </MenuItem>
                        );
                    });
                    var errorMessage;
                    if (menuItems.length === 0) {
                        errorMessage = "No results for '" + value + "'.";
                    }
                    t.setState({
                        'errorMessage': errorMessage,
                        'menuItems': menuItems,
                        'isOpen': menuItems.length > 0,
                        'loading': false
                    });
                });
                t.state.currentRequest.fail(function (err) {
                    var errorMessage = "Failed to load data from '" + t.props.restUrl;
                    t.setState({
                        'loading': false,
                        'errorMessage': errorMessage
                    });
                    console.error(errorMessage);
                });
                t.state.currentRequest.always(function () {
                    t.currentRequest = null;
                });
            };
            t.setState({
                'timer': setTimeout(populateMenu, t.props.requestDelayMs),
                'errorMessage': null
            });
        }
        else {
            t.setState({
                'isOpen': false,
                'errorMessage': 'You must enter at least ' + t.props.minChars + ' characters to retrieve options.'
            });
        }
        t.setState({
            'value': value
        });
    },

    componentWillUnmount: function() {
        if (!!this.currentRequest) {
            this.currentRequest.abort();
        }
    },

    getDefaultProps: function() {
        return {
            'minChars': 3,
            'requestDelayMs': 200,
            'placeholder': 'Enter text',
            'initialValue': ''
        };
    },

    getInitialState: function() {
        return {
            'value': this.props.initialValue,
            'menuItems': [],
            'isOpen': false,
            'loading': false
        };
    },

    render: function() {
        var t = this;
        var messageIcon;
        if (t.state.loading) {
            messageIcon = (
                <Link
                    id={t.props.id + '-loading'}
                    className="loading"
                />
            );
        }
        else if (!!t.state.errorMessage) {
            messageIcon = (
                <Link
                    id={t.props.id + '-validation-error'}
                    tooltip={t.state.errorMessage}
                    className="errorIcon"
                />
            );
        }
        return (
            <Dropdown id={t.props.id} open={t.state.isOpen} className={"rest-combobox " + t.props.className}>
                <FormControl
                    bsRole="toggle"
                    id={t.props.id + "-input"}
                    type="text"
                    className="form-control"
                    placeholder={t.props.placeholder}
                    value={t.state.value}
                    onChange={t.onChange}
                />
                {messageIcon}
                <ComboBoxMenu bsRole="menu" id={t.props.id + "-menu"} menuItems={t.state.menuItems} />
            </Dropdown>
        );
    }
});
