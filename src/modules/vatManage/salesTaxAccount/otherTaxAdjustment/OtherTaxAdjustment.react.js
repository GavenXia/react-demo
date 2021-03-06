/*
 * @Author: liuchunxiu
 * @Date: 2018-04-04 17:52:53
 * @Last Modified by: liuchunxiu
 * @Last Modified time: 2018-04-19 11:52:33
 */
import React, { Component } from "react";
import { Button, Modal, message, Icon } from "antd";
import { SearchTable } from "compoments";
import PopModal from "./popModal";
import {
  request,
  fMoney,
  getUrlParam,
  listMainResultStatus
} from "../../../../utils";
import { withRouter } from "react-router";
import moment from "moment";

const searchFields = disabled => {
  return [
    {
      label: "纳税主体",
      type: "taxMain",
      span: 6,
      fieldName: "mainId",
      componentProps: {
        disabled
      },
      fieldDecoratorOptions: {
        initialValue: (disabled && getUrlParam("mainId")) || undefined,
        rules: [
          {
            required: true,
            message: "请选择纳税主体"
          }
        ]
      }
    },
    {
      label: "调整日期",
      fieldName: "adjustDate",
      type: "monthPicker",
      span: 6,
      componentProps: {
        format: "YYYY-MM",
        disabled
      },
      fieldDecoratorOptions: {
        initialValue:
          (disabled && moment(getUrlParam("authMonth"), "YYYY-MM")) ||
          undefined,
        rules: [
          {
            required: true,
            message: "请选择调整日期"
          }
        ]
      }
    }
  ];
};
const getColumns = context => [
  {
    title: "操作",
    render(text, record, index) {
      return (
        <div>
          <a
            style={{ margin: "0 5px" }}
            onClick={() => {
              context.setState({
                visible: true,
                action: "modify",
                opid: record.id
              });
            }}
          >
            编辑
          </a>
          <span style={{
              color:'#f5222d',
              cursor:'pointer'
          }} onClick={()=>{
              const modalRef = Modal.confirm({
                  title: '友情提醒',
                  content: '该删除后将不可恢复，是否删除？',
                  okText: '确定',
                  okType: 'danger',
                  cancelText: '取消',
                  onOk:()=>{
                      context.deleteRecord(record.id,()=>{
                          modalRef && modalRef.destroy();
                          context.update()
                      })
                  },
                  onCancel() {
                      modalRef.destroy()
                  },
              });
          }}>
                删除
            </span>
        </div>
      );
    },
    fixed: "left",
    width: "75px",
    dataIndex: "action",
    className:'text-center'
  },
  {
    title: "纳税主体",
    dataIndex: "mainName"
  },
  {
    title: ["项目","应税项目"],
    dataIndex: ["project","taxableProjectName"],
    render(text, record) {
      let project
      switch (record.project) {
        case "1":
          project = "涉税调整";
          break
        case "2":
          project = "纳税检查调整";
          break
        default:
          project = '';
          break
      }
      return <div >
               <p style={{marginBottom:'0px',lineHeight:'1.5',color:'#000'}}>{project}</p>
               <p style={{marginBottom:'0px',lineHeight:'1.5',color:'#ccc'}}>{record.taxableProjectName}</p>

             </div>
    }
  },
  {
    title: "业务类型",
    dataIndex: "taxRateName"
  },
  {
    title: "税率",
    dataIndex: "taxRate",
    render: text => (text ? `${text}%` : text),
    width: "50px"
  },
  {
    title: "销售额（不含税）",
    dataIndex: "amountWithoutTax",
    render: text => fMoney(text),
    className: "table-money"
  },
  {
    title: "销项（应纳）税额",
    dataIndex: "taxAmountWithTax",
    render: text => fMoney(text),
    className: "table-money"
  },
  {
    title: "服务、不动产和无形资产扣除项目本期实际扣除金额（含税）",
    dataIndex: "deductionAmount",
    render: text => fMoney(text),
    className: "table-money",
    width: "100px"
  },
  {
    title: ["调整日期","调整原因"],
    dataIndex: ["adjustDate","adjustReason"],
    render(text, record) {
      let Reason
      switch (record.adjustReason) {
        case "1":
          Reason = "尾款调整";
          break
        case "2":
          Reason = "非地产业务（租金，水电费等）相关调整";
          break
        case "3":
          Reason = "未开票收入差异调整";
          break
        default:
          Reason="";
          break
      }
      return <div >
               <p style={{marginBottom:'0px',lineHeight:'1.5',color:'#000'}}>{record.adjustDate}</p>
               <p style={{marginBottom:'0px',lineHeight:'1.5',color:'#ccc'}}>{Reason}</p>
             </div>
    }
  },
  {
    title: "具体调整说明",
    dataIndex: "adjustDescription"
  }
];

class OtherTaxAdjustment extends Component {
  state = {
    visible: false, // 控制Modal是否显示
    opid: "", // 当前操作的记录
    action: "add",
    updateKey: Date.now(),
    filters: undefined,
    status: undefined,
    submitLoading: false,
    revokeLoading: false,
    dataSource: []
  };
  hideModal() {
    this.setState({ visible: false });
  }
  update = () => {
    this.setState({ updateKey: Date.now() });
  };
  deleteRecord = (id,cb) => {
      request.delete(`/account/output/othertax/delete/${id}`)
          .then(({data})=>{
              if(data.code===200){
                  message.success("删除成功", 4);
                  cb && cb()
              }else{
                  message.error(data.msg, 4);
              }
          })
          .catch(err => {
              message.error(err.message);
          });
  }
  updateStatus = (values = this.state.filters) => {
    this.setState({ filters: values });
    request
      .get("/account/output/othertax/main/listMain", { params: values })
      .then(({ data }) => {
        if (data.code === 200) {
          let status = {};
          if (data.data) {
            status.status = data.data.status;
            status.lastModifiedDate = data.data.lastModifiedDate;
            this.setState({ status: status, filters: values });
          }
        }
      });
  };
  commonSubmit = (url, params, action, messageInfo) => {
    this.setState({ [`${action}Loading`]: true });
    request
      .post(url, params)
      .then(({ data }) => {
        if (data.code === 200) {
          message.success(messageInfo, 4);
          this.setState({ [`${action}Loading`]: false });
          this.updateStatus(params);
        } else {
          message.error(data.msg, 4);
          this.setState({ [`${action}Loading`]: false });
        }
      })
      .catch(err => {
        message.error(err.message);
        this.setState({ [`${action}Loading`]: false });
      });
  };
  submit = () => {
    let params = { ...this.state.filters };
    this.commonSubmit(
      "/account/output/othertax/main/submit",
      params,
      "submit",
      "提交成功"
    );
  };
  revoke = () => {
    let params = { ...this.state.filters };
    this.commonSubmit(
      "/account/output/othertax/main/restore",
      params,
      "revoke",
      "撤回提交成功"
    );
  };
  componentDidMount() {
    const { search } = this.props.location;
    if (!!search) {
      this.update();
    }
  }
  render() {
    const { search } = this.props.location;
    let disabled = !!search;
    let { filters, status, dataSource } = this.state,
      buttonDisabled =
        !filters || !(dataSource && dataSource.length && dataSource.length > 0),
      isSubmit = status && status.status === 2;
    let columns = getColumns(this);
    isSubmit && columns.shift();
    return (
      <div>
        <SearchTable
          doNotFetchDidMount={true}
          searchOption={{
            fields: searchFields(disabled)
          }}
          backCondition={values => {
            let params = { mainId: values.mainId, taxMonth: values.adjustDate };
            this.setState({ filters: params });
            this.updateStatus(params);
          }}
          tableOption={{
            scroll: { x: "100%" },
            pageSize: 10,
            columns: columns,
            key: this.state.updateKey,
            url: "/account/output/othertax/list",
            cardProps: {
              title: "其他涉税调整台账",
              extra: (
                <div>
                  {dataSource.length > 0 && listMainResultStatus(status)}
                  <Button
                    size="small"
                    style={{ marginRight: 5 }}
                    disabled={isSubmit}
                    onClick={() => {
                      this.setState({
                        visible: true,
                        action: "add",
                        opid: undefined
                      });
                    }}
                  >
                    <Icon type="plus" />新增
                  </Button>
                  <Button
                    size="small"
                    style={{ marginRight: 5 }}
                    disabled={buttonDisabled || isSubmit}
                    onClick={this.submit}
                    loading={this.state.submitLoading}
                  >
                    <Icon type="check" />
                    提交
                  </Button>
                  <Button
                    size="small"
                    style={{ marginRight: 5 }}
                    disabled={buttonDisabled || !isSubmit}
                    onClick={this.revoke}
                    loading={this.state.revokeLoading}
                  >
                    <Icon type="rollback" />
                    撤回提交
                  </Button>
                </div>
              )
            },
            onDataChange: data => {
              this.setState({
                buttonDisabled: false,
                dataSource: data
              });
            }
          }}
        />
        <PopModal
          visible={this.state.visible}
          action={this.state.action}
          hideModal={() => {
            this.hideModal();
          }}
          id={this.state.opid}
          update={this.update}
        />
      </div>
    );
  }
}
export default withRouter(OtherTaxAdjustment);
