import React from 'react';
import rcUtil, {joinClasses, classSet} from 'rc-util';
import Tree from './Tree';

Tree.statics = Tree.statics();

class TreeNode extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      expanded: props.expandAll || props.expanded || props.defaultExpanded,
      selected: props.selected || false,
      checkPart: props._checkPart || false,
      checked: props._checked || false,
    };
    ['handleExpandedState', 'handleSelect', 'handleChecked'].forEach((m)=> {
      this[m] = this[m].bind(this);
    });
  }
  componentDidMount() {
    this.componentDidUpdate();
  }
  componentWillReceiveProps(nextProps) {
    this.setState({
      // selected: nextProps.selected,
      checkPart: nextProps._checkPart,
      checked: nextProps._checked,
    });
  }
  shouldComponentUpdate(nextProps, nextState) {
    const checkbox = this.refs.checkbox;
    if (checkbox) {
      const cls = checkbox.getDOMNode().className;
      const checkSt = Tree.statics.treeNodesState[this.props._pos] || {};
      checkSt.checkPart = nextState.checkPart;
      checkSt.checked = nextState.checked;
      if (nextState.checkPart) {
        checkbox.getDOMNode().className = cls.indexOf('checkbox_true_part') > -1 ? cls : cls + ' checkbox_true_part';
        return false;
      }
      checkbox.getDOMNode().className = cls.replace(/checkbox_true_part/g, '');
    }
    return true;
  }
  componentDidUpdate() {
    if (this.newChildren) {
      for (let i = 0; i < Tree.statics.trees.length; i++) {
        const obj = Tree.statics.trees[i];
        if (obj.props._pos === this.props._pos) {
          Tree.statics.trees.splice(i--, 1);
        }
      }
      Tree.statics.trees.push(this);
    }
    // add treeNodes checked state
    Tree.statics.treeNodesState[this.props._pos] = {
      checked: this.state.checked,
      checkPart: this.state.checkPart,
    };
  }
  renderChildren(children) {
    let newChildren = null;
    if (children.type === TreeNode || Array.isArray(children) &&
        children.every(function chEvery(item) {
          return item.type === TreeNode;
        })) {
      const cls = {};
      cls[this.props.prefixCls + '-child-tree'] = true;
      if (this.props.showLine && this.props._index !== this.props._len - 1) {
        cls.line = true;
      }

      const treeProps = {
        _level: this.props._level + 1,
        _pos: this.props._pos,
        _isChildTree: true,
        _checked: this.state.checked,
        _checkPart: this.state.checkPart,
        className: classSet(cls),
        showLine: this.props.showLine,
        showIcon: this.props.showIcon,
        expanded: this.state.expanded,
        expandAll: this.props.expandAll,
        // selected: this.state.checked,
        checkable: this.props.checkable, // 只是为了传递根节点上的checkable设置,是否有更好做法?
        onChecked: this.props.onChecked,
        onSelect: this.props.onSelect,
      };
      newChildren = this.newChildren = <Tree {...treeProps}>{children}</Tree>;
    } else {
      newChildren = children;
    }

    return newChildren;
  }
  render() {
    const props = this.props;
    const state = this.state;

    const prefixCls = props.prefixCls;
    const switchState = state.expanded ? 'open' : 'close';

    const switcherCls = {};
    switcherCls.button = true;
    switcherCls[prefixCls + '-treenode-switcher'] = true;
    switcherCls[prefixCls + '-switcher__' + switchState] = true;
    if (!props.showLine) {
      switcherCls['noline_' + switchState] = true;
    } else if (props._isChildTree && props._index === 0) {
      if (props._len !== 1) {
        switcherCls['center_' + switchState] = true;
      } else {
        switcherCls['bottom_' + switchState] = true;
      }
    } else if (props._index === 0) {
      switcherCls['roots_' + switchState] = true;
    } else if (props._index === props._len - 1) {
      switcherCls['bottom_' + switchState] = true;
    } else {
      switcherCls['center_' + switchState] = true;
    }

    let checkbox = null;
    const checkboxCls = {};
    if (props.checkable) {
      checkboxCls.button = true;
      checkboxCls.chk = true;
      /* jshint ignore:start */
      if (state.checkPart) {
        checkboxCls.checkbox_true_part = true;
      } else if (state.checked) {
        checkboxCls.checkbox_true_full = true;
      } else {
        checkboxCls.checkbox_false_full = true;
      }
      /* jshint ignore:end */
      checkbox = <span ref="checkbox" className={classSet(checkboxCls)} onClick={this.handleChecked}></span>;
    }

    const iconEleCls = {
      button: true,
      [prefixCls + '-iconEle']: true,
      [prefixCls + '-icon__' + switchState]: true,
    };

    let content = props.title;
    let newChildren = this.renderChildren(props.children);
    if (newChildren === props.children) {
      content = newChildren;
      newChildren = null;
    }

    return (
      <li className={joinClasses(props.className, 'level' + props._level, 'pos-' + props._pos)}>
        <span className={classSet(switcherCls)}
              onClick={this.handleExpandedState}></span>
        {checkbox}
        <a ref="selectHandle" title={content}
           className={state.selected ? prefixCls + '-selected' : ''}
           onClick={this.handleSelect}>
          {props.showIcon ? <span className={classSet(iconEleCls)}></span> : null}
          <span className="title">{content}</span>
        </a>
        {newChildren}
      </li>
    );
  }
  switchExpandedState(newState, onStateChangeComplete) {
    this.setState({
      expanded: newState,
    }, onStateChangeComplete);
  }
  // keyboard event support
  handleKeyDown(e) {
    e.preventDefault();
  }
  handleExpandedState() {
    this.switchExpandedState(!this.state.expanded);
  }
  handleSelect() {
    this.setState({
      selected: !this.state.selected,
    });
    if (this.props.onSelect) {
      this.props.onSelect(!this.state.selected, this);
    }
  }
  handleChecked() {
    const _pos = this.props._pos;
    const checked = !this.state.checked;

    if (this.state.checkPart) {
      checked = false;
    }

    const nSt = {
      checkPart: false,
      checked: checked,
    };

    this.setState(nSt);

    const sortedTree = Tree.statics.trees.sort(function sortTree(a, b) {
      return b.props._pos.length - a.props._pos.length;
    });

    sortedTree.forEach(function forofTree(c) {
      const cPos = c.props._pos;
      if (_pos.indexOf(cPos) === 0 && _pos !== cPos) {
        const childArr = rcUtil.Children.toArray(c.props.children);
        const len = childArr.length;

        let checkedNumbers = 0;

        // 先计算已经选中的节点数
        for (let i = 0; i < len; i++) {
          const checkSt = Tree.statics.treeNodesState[cPos + '-' + i];
          if (checkSt.checked) {
            checkedNumbers++;
          } else if (checkSt.checkPart) {
            checkedNumbers += 0.5;
          }
        }

        // 点击节点的 直接父级
        if (_pos.length - cPos.length <= 2) {
          // 如果原来是半选
          if (Tree.statics.treeNodesState[_pos].checkPart) {
            // checked ? checkedNumbers += 0.5 : checkedNumbers -= 0.5;
            if (checked) {
              checkedNumbers += 0.5;
            } else {
              checkedNumbers -= 0.5;
            }
          } else if (checked) {
            checkedNumbers++;
          } else {
            checkedNumbers--;
          }
        }

        let newSt;
        if (checkedNumbers <= 0) {
          // 都不选
          newSt = {
            checkPart: false,
            checked: false,
          };
        } else if (checkedNumbers === len) {
          // 全选
          newSt = {
            checkPart: false,
            checked: true,
          };
        } else {
          // 部分选择
          newSt = {
            checkPart: true,
            checked: false,
          };
        }
        c.setState(newSt);
        Tree.statics.treeNodesState[cPos] = newSt;
      }
    });

    Tree.statics.treeNodesState[_pos] = nSt;

    if (this.props.onChecked) {
      this.props.onChecked(checked, this);
    }
  }
}
TreeNode.propTypes = {
  _pos: React.PropTypes.string,
  _index: React.PropTypes.string,
  _len: React.PropTypes.string,
  _level: React.PropTypes.string,
  prefixCls: React.PropTypes.string,
  showLine: React.PropTypes.bool,
  showIcon: React.PropTypes.bool,
  expandAll: React.PropTypes.bool,
  defaultExpanded: React.PropTypes.bool,
  expanded: React.PropTypes.bool,
  selected: React.PropTypes.bool,
  checkable: React.PropTypes.bool,
  onSelect: React.PropTypes.func,
  onChecked: React.PropTypes.func,
};
TreeNode.defaultProps = {
  title: '---',
  defaultExpanded: false,
  expanded: false,
};

export default TreeNode;