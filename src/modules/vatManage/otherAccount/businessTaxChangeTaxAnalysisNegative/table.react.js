/*
 * @Author: liuchunxiu
 * @Date: 2018-04-20 09:46:25
 * @Last Modified by: xiaminghua
 * @Last Modified time: 2018-04-28
 */
import React from "react";
import { Table, Card, Button, Icon, message, Modal } from "antd";
import { request, fMoney, listMainResultStatus } from "utils";
import SubmitOrRecallMutex from 'compoments/buttonModalWithForm/SubmitOrRecallMutex.r'
import { CusFormItem } from "compoments";
const NumericItem = CusFormItem.NumericInput;
const getColumns = (context, tax1Count = 0, tax2Count = 0) => [
  {
    title: "项目及栏次",
    children: [
      {
        title: "计税方法",
        dataIndex: "taxMethod",
        render: (text, record, index) => {
          const obj = {
            children: text,
            props: {}
          };

          if (text === 1 || text === "1") {
            obj.children = "一般计税";
          } else if (text === 2 || text === "2") {
            obj.children = "简易计税";
          }

          if (index === 0) {
            obj.props.rowSpan = tax1Count;
          } else if (index === tax1Count) {
            obj.props.rowSpan = tax2Count;
          } else if (record.isBigCount) {
            obj.props.colSpan = 5;
            obj.children = "合计";
          } else {
            obj.props.rowSpan = 0;
          }
          return obj;
        }
      },
      {
        title: "应税代码",
        dataIndex: "taxableNum",
        render: (text, record, index) => {
          const obj = {
            children: text,
            props: {}
          };
          if (record.isBigCount) {
            obj.props.colSpan = 0;
          }
          if (record.isLittleCount) {
            obj.props.colSpan = 4;
            obj.children = "小计";
          }
          return obj;
        }
      },
      {
        title: "应税项目名称",
        dataIndex: "taxableItem",
        render: (text, record, index) => {
          const obj = {
            children: text,
            props: {}
          };
          if (record.isBigCount || record.isLittleCount) {
            obj.props.colSpan = 0;
          }
          return obj;
        }
      },
      {
        title: "增值税税率或增收率",
        dataIndex: "addedTaxRate",
        render: (text, record, index) => {
          const obj = {
            children: text ? `${text}%` : "",
            props: {}
          };
          if (record.isBigCount || record.isLittleCount) {
            obj.props.colSpan = 0;
          }
          return obj;
        }
      },
      {
        title: "营业税税率",
        dataIndex: "businessTaxRate",
        render: (text, record, index) => {
          const obj = {
            children: text ? `${text}%` : "",
            props: {}
          };
          if (record.isBigCount || record.isLittleCount) {
            obj.props.colSpan = 0;
          }
          return obj;
        }
      }
    ]
  },
  {
    title: "增值税",
    children: [
      {
        title: "不含税销售额",
        children: [
          {
            title: "1",
            dataIndex: "addedAmountWithout",
            render: text => fMoney(text),
            className: "table-money"
          }
        ]
      },
      {
        title: "销项（应纳）税额",
        children: [
          {
            title: "2=1×增值税税率或增收率",
            dataIndex: "addedAmountInvoice",
            render: text => fMoney(text),
            className: "table-money"
          }
        ]
      },
      {
        title: "价税合计",
        children: [
          {
            title: "3=1+2",
            dataIndex: "addedTotalAmount",
            render: text => fMoney(text),
            className: "table-money"
          }
        ]
      },
      {
        title: "服务、不动产和无形资产",
        children: [
          {
            title: "4",
            dataIndex: "addedEstate",
            render: text => fMoney(text),
            className: "table-money"
          }
        ]
      },
      {
        title: "扣除后",
        children: [
          {
            title: "含税销售额",
            children: [
              {
                title: "5=3-4",
                dataIndex: "addedWithoutDeduct",
                render: text => fMoney(text),
                className: "table-money"
              }
            ]
          },
          {
            title: "销项（应纳）税额",
            children: [
              {
                title: "6=5÷(100%+增值税税率或征收率)×增值税税率或征收率",
                dataIndex: "addedInvoiceDeduct",
                render: text => fMoney(text),
                className: "table-money"
              }
            ]
          }
        ]
      },
      {
        title: "销项税额占比",
        children: [
          {
            title: "7",
            dataIndex: "addedInvoiceRate",
            render: text => fMoney(text),
            className: "table-money"
          }
        ]
      },
      {
        title: "一般计税方法应纳税额",
        children: [
          {
            title: "8",
            dataIndex: "addedAmountCommonly",
            render: (text, record, index) => {
              const obj = {
                children: fMoney(text),
                props: {}
              };

              if (index === 0) {
                obj.props.rowSpan = tax1Count;
              } else if (index < tax1Count) {
                obj.props.rowSpan = 0;
              }

              return obj;
            },
            className: "table-money"
          }
        ]
      },
      {
        title: "增值税应纳税额测算",
        children: [
          {
            title: "9",
            dataIndex: "addedAmountPayable",
            render: text => fMoney(text),
            className: "table-money"
          }
        ]
      }
    ]
  },
  {
    title: "营业额",
    children: [
      {
        title: "原营业税税制下服务、不动产和无形资产差额扣除项目",
        children: [
          {
            title: "期初余额",
            children: [
              {
                title: "10",
                dataIndex: "businessStartAmount",
                render: (text, record, index) => {
                  if (
                    record.isLittleCount ||
                    record.isBigCount ||
                    index === tax1Count - 1 ||
                    index >= tax1Count + tax2Count ||
                    (context.state.currentStatus &&
                      context.state.currentStatus.status === 2)
                  ) {
                    return fMoney(text);
                  } else {
                    return (
                      <NumericItem
                        value={text}
                        style={{ width: 100 }}
                        size="small"
                        onChange={value => {
                          context.inputChange(
                            { businessStartAmount: value },
                            index
                          );
                        }}
                      />
                    );
                  }
                },
                className: "table-money"
              }
            ]
          },
          {
            title: "本期发生额",
            children: [
              {
                title: "11",
                dataIndex: "businessCurrentAmount",
                render: (text, record, index) => {
                  if (
                    record.isLittleCount ||
                    record.isBigCount ||
                    index === tax1Count - 1 ||
                    index >= tax1Count + tax2Count ||
                    (context.state.currentStatus &&
                      context.state.currentStatus.status === 2)
                  ) {
                    return fMoney(text);
                  } else {
                    return (
                      <NumericItem
                        value={text}
                        style={{ width: 100 }}
                        size="small"
                        onChange={value => {
                          context.inputChange(
                            { businessCurrentAmount: value },
                            index
                          );
                        }}
                      />
                    );
                  }
                },
                className: "table-money"
              }
            ]
          },
          {
            title: "本期应扣除金额",
            children: [
              {
                title: "12=10+11",
                dataIndex: "businessShouldDeduct",
                render: text => fMoney(text),
                className: "table-money"
              }
            ]
          },
          {
            title: "本期实际扣除金额",
            children: [
              {
                title: "13（13≤3且13≤12）",
                dataIndex: "businessActualDeduct",
                render: text => fMoney(text),
                className: "table-money"
              }
            ]
          },
          {
            title: "期末余额",
            children: [
              {
                title: "14=12-13",
                dataIndex: "businessEndAmount",
                render: text => fMoney(text),
                className: "table-money"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    title: "营业税额",
    children: [
      {
        title: "15=3-13",
        dataIndex: "businessTaxAmount",
        render: text => fMoney(text),
        className: "table-money"
      }
    ]
  },
  {
    title: "营业税应纳税额",
    children: [
      {
        title: "16=15×营业税税率",
        dataIndex: "businessShouldAmount",
        render: text => fMoney(text),
        className: "table-money"
      }
    ]
  }
];

const getNeedFields = ({
  id,
  taxMethod,
  taxableNum,
  taxableItem,
  addedTaxRate,
  businessTaxRate,
  addedAmountWithout,
  addedAmountInvoice,
  addedTotalAmount,
  addedEstate,
  addedWithoutDeduct,
  addedInvoiceDeduct,
  addedInvoiceRate,
  addedAmountCommonly,
  addedAmountPayable,
  businessStartAmount,
  businessCurrentAmount,
  businessShouldDeduct,
  businessEndAmount,
  businessTaxAmount,
  businessShouldAmount,
  businessActualDeduct
}) => {
  let obj = {
    id,
    taxMethod,
    taxableNum,
    taxableItem,
    addedTaxRate,
    businessTaxRate,
    addedAmountWithout,
    addedAmountInvoice,
    addedTotalAmount,
    addedEstate,
    addedWithoutDeduct,
    addedInvoiceDeduct,
    addedInvoiceRate,
    addedAmountCommonly,
    addedAmountPayable,
    businessStartAmount,
    businessCurrentAmount,
    businessShouldDeduct,
    businessEndAmount,
    businessTaxAmount,
    businessShouldAmount,
    businessActualDeduct
  };
  return obj;
};

const reConstructData = data => {
  let newDataSource = [];
  if (!data) {
    return { newDataSource, tax1Count: 0, tax2Count: 0 };
  }

  let temp,
    key = 0;
  const tax1 = data.page.records[0].page.records,
    tax2 = data.page.records[1].page.records,
    tax1Count = data.page.records[0],
    tax2Count = data.page.records[1],
    mainCount = data;

  // 第一种纳税方式数据
  tax1 &&
    tax1.forEach(element => {
      temp = getNeedFields(element);
      temp.key = key++;
      newDataSource.push(temp);
    });

  // 第一种纳税方式小计
  temp = getNeedFields(tax1Count);
  temp.isLittleCount = true;
  temp.key = key++;
  newDataSource.push(temp);

  // 一般计税方式
  tax2 &&
    tax2.forEach(element => {
      temp = getNeedFields(element);
      temp.key = key++;
      newDataSource.push(temp);
    });

  // 一般计税方式小计
  temp = getNeedFields(tax2Count);
  temp.isLittleCount = true;
  temp.key = key++;
  newDataSource.push(temp);

  // 最后一条合计
  temp = getNeedFields(mainCount);
  temp.isBigCount = true;
  temp.key = key++;
  newDataSource.push(temp);
  return {
    newDataSource,
    tax1Count: tax1.length + 1,
    tax2Count: tax1.length + 1
  };
};

export default class extends React.Component {
  state = {
    loading: false,
    dataSource: [],
    tax1Count: 0,
    tax2Count: 0,
    currentStatus: undefined,
    saveLoading: false,
    revokeLoading: false,
    submitLoading: false,
    resetLoading: false
  };
  inputChange = (obj, index) => {
    let newDataSource = [...this.state.dataSource];
    newDataSource[index] = { ...newDataSource[index], ...obj };
    this.setState({ dataSource: newDataSource });
  };
  componentWillReceiveProps(nextProps) {
    if (this.props.updateKey !== nextProps.updateKey && nextProps.filter) {
      this.fetchTable("/account/other/camping/list", nextProps.filter);
    }
  }
  save = () => {
    let params = {
      ...this.props.filter,
      list: this.state.dataSource.filter(
        ele => !(ele.isBigCount || ele.isLittleCount)
      )
    };
    this.commonSubmit(
      "/account/other/camping/save",
      params,
      "save",
      "保存成功"
    );
  };
  reCalculate = () => {
    Modal.confirm({
      title: "友情提醒",
      content: "确定要重算吗",
      onOk: () => {
        let params = { ...this.props.filter };
        this.commonSubmit(
          "/account/other/camping/reset",
          params,
          "reset",
          "重算成功",
          "put"
        );
      }
    });
  };
  submit = () => {
    let params = { ...this.props.filter };
    this.commonSubmit(
      "/account/other/camping/submit",
      params,
      "submit",
      "提交成功"
    );
  };
  revoke = () => {
    let params = { ...this.props.filter };
    this.commonSubmit(
      "/account/other/camping/revoke",
      params,
      "revoke",
      "撤回提交成功"
    );
  };
  fetchTable = (url = "/account/other/camping/list", filter) => {
    this.setState({ loading: true });
    request
      .get(url, { params: filter })
      .then(({ data }) => {
        if (data.code === 200) {
          let { newDataSource, tax1Count, tax2Count } = reConstructData(
            data.data
          );
          this.setState({
            dataSource: newDataSource,
            tax1Count,
            tax2Count,
            loading: false
          });
          this.updateStatus(filter);
        } else {
          message.error(data.msg, 4);
          this.setState({
            loading: false,
            dataSource: [],
            currentStatus: undefined
          });
        }
      })
      .catch(err => {
        message.error(err.message);
        this.setState({
          loading: false,
          dataSource: [],
          currentStatus: undefined
        });
      });
  };
  commonSubmit = (url, params, action, messageInfo, method = "post") => {
    this.setState({ [`${action}Loading`]: true });
    request[method](url, params)
      .then(({ data }) => {
        if (data.code === 200) {
          message.success(messageInfo, 4);
          this.setState({ [`${action}Loading`]: false });
          this.fetchTable("/account/other/camping/list", this.props.filter);
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
  updateStatus = filter => {
    this.setState({ currentStatus: undefined });
    request
      .get(`/account/other/camping/listMain`, { params: filter })
      .then(({ data }) => {
        if (data.code === 200) {
          let currentStatus = {},
            statusData = data.data;
          currentStatus.status = statusData.status;
          currentStatus.lastModifiedDate = statusData.lastModifiedDate;
          this.setState({ currentStatus });
        }
      });
  };
  render() {
    let { dataSource, tax1Count, tax2Count, currentStatus } = this.state;
    const buttonDisabled =
        !this.props.filter ||
        !(dataSource && dataSource.length && dataSource.length > 0),
      isSubmit = currentStatus && currentStatus.status === 2;
    return (
      <Card
        title="营改增税负分析测算台账"
        extra={
          <div>
            {dataSource.length > 0 && listMainResultStatus(currentStatus)}
            <Button
              size="small"
              style={{ marginRight: 5 }}
              disabled={buttonDisabled || isSubmit}
              onClick={this.save}
              loading={this.state.saveLoading}
            >
              <Icon type="hdd" />
              保存
            </Button>
            <Button
              size="small"
              style={{ marginRight: 5 }}
              disabled={buttonDisabled || isSubmit}
              onClick={this.reCalculate}
            >
              <Icon type="retweet" />
              重算
            </Button>
            <SubmitOrRecallMutex
                url="/account/other/camping"
                refreshTable={this.props.refreshTable}
                hasParam={this.props.filter || (dataSource && dataSource.length && dataSource.length > 0)}
                dataStatus={currentStatus && currentStatus.status}
                searchFieldsValues={this.props.filter}
              />

          </div>
        }
        style={{ marginTop: 10 }}
      >
        <Table
          key={this.state.tableKey}
          loading={this.state.loading}
          columns={getColumns(this, tax1Count, tax2Count)}
          dataSource={dataSource}
          size="small"
          scroll={{ x: "240%" }}
          pagination={false}
          rowKey="key"
        />
      </Card>
    );
  }
}
