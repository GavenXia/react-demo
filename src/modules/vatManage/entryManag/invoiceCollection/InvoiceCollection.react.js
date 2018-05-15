/**
 * author       : liuliyuan
 * createTime   : 2018/1/15 10:57
 * description  :
 */
import React, { Component } from 'react'
import {Layout,Card,Row,Col,Form,Button,Icon,Modal,message } from 'antd'
import {AsyncTable,FileExport,FileImportModal,FileUndoImportModal,TableTotal,AdvancedFilter} from 'compoments'
import SubmitOrRecall from 'compoments/buttonModalWithForm/SubmitOrRecall.r'
import {request,requestDict,fMoney,getFields,getUrlParam,listMainResultStatus} from 'utils'
import { withRouter } from 'react-router'
import moment from 'moment';
import PopModal from './popModal'
const buttonStyle={
    marginRight:5
}
const fields = [
    {
        label:'纳税主体',
        fieldName:'mainId',
        type:'taxMain',
        span:24,
        fieldDecoratorOptions:{
            rules:[
                {
                    required:true,
                    message:'请选择纳税主体'
                }
            ]
        },
    }, {
        label: '认证月份',
        fieldName: 'authMonth',
        type: 'monthPicker',
        span: 24,
        componentProps: {},
        fieldDecoratorOptions: {
            rules: [
                {
                    required: true,
                    message: '请选择认证月份'
                }
            ]
        },
    }
]
const advancedFields =[
  {
      label:'发票号码',
      fieldName:'invoiceNum',
      type:'input',
      span:6,
      componentProps:{
      },
      fieldDecoratorOptions:{
      },
  }
]
class InvoiceCollection extends Component {
    state={
        /**
         * params条件，给table用的
         * */
        filters:{},

        /**
         *修改状态和时间
         * */
        statusParam:{},
        /**
         * 控制table刷新，要让table刷新，只要给这个值设置成新值即可
         * */
        tableUpDateKey:Date.now(),
        dataSource:[],
        selectedRowKeys:null,
        selectedRows:null,
        visible:false,
        modalConfig:{
            type:''
        },
        nssbData:[],
        advancedFilterShow:false,
        totalSource:undefined,
    }

    columns = [
        {
            title: '数据来源',
            dataIndex: 'sourceType',
            render:text=>{
                text = parseInt(text,0)
                if(text===1){
                    return '手工采集'
                }
                if(text===2){
                    return '外部导入'
                }
                return ''
            }
        },{
            title: '纳税主体',
            dataIndex: 'mainName',
        },{
            title:['发票类型','发票代码','发票号码'],
            dataIndex:['invoiceType','invoiceCode','invoiceNum'],
            render:(text,record)=>{
                let invoiceType="-"
                if(record.invoiceType==='s'){
                    invoiceType = '专票'
                }
                if(record.invoiceType==='c'){
                    invoiceType = '普票'
                }
                return <div>
                         <p style={{marginBottom:'0px',lineHeight:'1.5',color:'#000'}}>{invoiceType}</p>
                         <p style={{marginBottom:'0px',lineHeight:'1.5',color:'#ccc'}}>{record.invoiceCode}</p>
                         <p style={{marginBottom:'0px',lineHeight:'1.5',color:'#ccc'}}>{record.invoiceNum}</p>
                        </div>;
            }
        },{
            title: '开票日期',
            dataIndex: 'billingDate',
            className:'text-center'
        },
        // {
        //     title: '认证月份',
        //     dataIndex: 'authMonth',
        // },
        {
            title: '认证时间',
            dataIndex: 'authDate',
            className:'text-center'
        },{
            title: ['销售单位名称','纳税人识别号'],
            dataIndex: ['sellerName','sellerTaxNum'],
        },{
            title:['价税合计','金额','税额'],
            dataIndex:['totalAmount','amount','taxAmount'],
            render:(text,record)=><div className='table-money'>
                     <p style={{marginBottom:'0px',lineHeight:'1.5',color:'#000'}}>{fMoney(record.totalAmount)}</p>
                     <p style={{marginBottom:'0px',lineHeight:'1.5',color:'#ccc'}}>{fMoney(record.amount)}</p>
                     <p style={{marginBottom:'0px',lineHeight:'1.5',color:'#ccc'}}>{fMoney(record.taxAmount)}</p>
                   </div>

        }
    ];
    handleSubmit = e => {
        e && e.preventDefault();
        this.props.form.validateFields((err, values) => {
            if (!err) {
                if(values.authMonth){
                    values.authMonth = values.authMonth.format('YYYY-MM')
                }
                this.setState({
                    selectedRowKeys:null,
                    advancedFilterShow:false,
                    filters:values
                },()=>{
                    this.refreshTable();
                });
            }
        });

    }
    toggleModalVisible=visible=>{
        this.setState({
            visible
        })
    }
    refreshTable = ()=>{
        this.setState({
            tableUpDateKey:Date.now()
        },()=>{
            this.updateStatus();
        })
    }
    showModal=type=>{
        if(type === 'edit'){
            let sourceType = parseInt(this.state.selectedRows[0].sourceType,0);
            if(sourceType === 2 ){
                const ref = Modal.warning({
                    title: '友情提醒',
                    content: '该发票信息是外部导入，无法修改！',
                    okText: '确定',
                    onOk:()=>{
                        ref.destroy();
                    }
                });
            }else{
                this.toggleModalVisible(true)
                this.setState({
                    modalConfig:{
                        type,
                        id:this.state.selectedRowKeys
                    }
                })
            }
        }else{
            this.toggleModalVisible(true)
            this.setState({
                modalConfig:{
                    type,
                    id:this.state.selectedRowKeys
                }
            })
        }
    }
    updateStatus=()=>{
        request.get('/income/invoice/collection/listMain',{params:this.state.filters}).then(({data}) => {
            if(data.code===200){
                this.setState({
                    statusParam: data.data,
                })
            }else{
                message.error(`列表主信息查询失败:${data.msg}`)
            }
        })
    }
    componentDidMount(){
        //获取纳税申报对应的数据字典
        requestDict('NSSB',result=>{
            this.setState({
                nssbData:result
            })
        });
    }
    componentWillReceiveProps(nextProps){
        if(this.props.taxSubjectId!==nextProps.taxSubjectId){
            this.initData()
        }
    }
    changeState=(data)=>{
      console.log(data)
      this.setState(data)
    }
    handleAdvancedFilter=()=>{
      this.setState(prevState => ({
     advancedFilterShow: !prevState.advancedFilterShow
      }));
    }

    render() {
        const {tableUpDateKey,filters,selectedRowKeys,visible,modalConfig,dataSource,statusParam,advancedFilterShow,totalSource} = this.state;
        const {mainId, authMonth} = this.state.filters;
        const disabled1 = !!((mainId && authMonth) && (statusParam && parseInt(statusParam.status, 0) === 1));
        const disabled2 = statusParam && parseInt(statusParam.status, 0) === 2;
        const {search} = this.props.location;
        let disabled = !!(search && search.filters);
        return (
            <Layout style={{background:'transparent'}} >
                <Card
                    style={{
                      borderTop:'none',
                      borderBottom:'none',
                      position:"relative",
                      zIndex:"101",
                      background:"#fff"
                    }}
                    className="search-card"
                >
                    <Form onSubmit={this.handleSubmit}>
                        <Row>
                            {
                                getFields(this.props.form,[
                                    {
                                        label:'纳税主体',
                                        fieldName:'mainId',
                                        type:'taxMain',
                                        span:6,
                                        componentProps:{
                                            disabled
                                        },
                                        fieldDecoratorOptions:{
                                            initialValue: (disabled && getUrlParam('mainId')) || undefined,
                                            rules:[
                                                {
                                                    required:true,
                                                    message:'请选择纳税主体'
                                                }
                                            ]
                                        },
                                    },{
                                        label:'认证月份',
                                        fieldName:'authMonth',
                                        type:'monthPicker',
                                        span:6,
                                        componentProps:{
                                            format:"YYYY-MM",
                                            disabled
                                        },
                                        fieldDecoratorOptions:{
                                            initialValue: (disabled && moment(getUrlParam('authMonth'), 'YYYY-MM')) || undefined,
                                            rules:[
                                                {
                                                    required:true,
                                                    message:'请选择认证月份'
                                                }
                                            ]
                                        },
                                    }
                                ])
                            }
                            <Col  span={advancedFilterShow?'0':'6'} className="btnAlignCenter">
                                    <Button disabled={disabled} size='small' style={{marginTop:5,marginLeft:20}} type="primary" htmlType="submit">查询</Button>
                                    <Button disabled={disabled} size='small' style={{marginTop:5,marginLeft:10}} onClick={()=>this.props.form.resetFields()}>重置</Button>

                            </Col>
                            {advancedFields&&<Col  style={{width:'100%',textAlign:'right'}}>
                                <span className='advancedFilterBtn' onClick={this.handleAdvancedFilter}>高级筛选</span>
                              </Col>
                            }
                        </Row>
                    </Form>
                </Card>
                <Row>
                  <AdvancedFilter
                    advancedOptions = {{
                      fields:advancedFields,
                      cardStyle:{top:'0'}
                    }}
                    form ={this.props.form}
                    advancedFilterShow = {advancedFilterShow}
                    changeState = {this.changeState}
                    handleSubmit = {this.handleSubmit}
                  />
                </Row>
                <Card
                      extra={<div>
                          {
                              dataSource.length>0 && listMainResultStatus(statusParam)
                          }
                          <Button size="small" onClick={()=>this.showModal('add')} disabled={disabled2} style={buttonStyle}>
                              <Icon type="plus" />
                              新增
                          </Button>
                          <FileImportModal
                              url="/income/invoice/collection/upload"
                              title="导入"
                              fields={fields}
                              disabled={disabled2}
                              onSuccess={()=>{
                                  this.refreshTable()
                              }}
                              style={{marginRight:5}} />
                          <FileUndoImportModal
                              url="/income/invoice/collection/revocation"
                              title="撤销导入"
                              disabled={disabled2}
                              onSuccess={()=>{
                                  this.refreshTable()
                              }}
                              style={{marginRight:5}} />
                          <FileExport
                              url={`income/invoice/collection/download`}
                              title="下载导入模板"
                              disabled={disabled2}
                              size="small"
                              setButtonStyle={{marginRight:5}}
                          />
                          <Button size="small" onClick={()=>this.showModal('edit')} disabled={!selectedRowKeys} style={buttonStyle}>
                              <Icon type="edit" />
                              编辑
                          </Button>
                          <Button size="small" onClick={()=>this.showModal('view')} disabled={!selectedRowKeys} style={buttonStyle}>
                              <Icon type="search" />
                              查看
                          </Button>
                          <Button
                              size="small"
                              style={buttonStyle}
                              onClick={()=>{
                                  let sourceType = parseInt(this.state.selectedRows[0].sourceType,0);
                                  if(sourceType === 2 ) {
                                      const ref = Modal.warning({
                                          title: '友情提醒',
                                          content: '该发票信息是外部导入，无法删除！',
                                          okText: '确定',
                                          onOk: () => {
                                              ref.destroy();
                                          }
                                      });
                                  }else {
                                      const modalRef = Modal.confirm({
                                          title: '友情提醒',
                                          content: '该删除后将不可恢复，是否删除？',
                                          okText: '确定',
                                          okType: 'danger',
                                          cancelText: '取消',
                                          onOk:()=>{
                                              request.delete(`/income/invoice/collection/delete/${this.state.selectedRowKeys[0]}`)
                                                  .then(({data}) => {
                                                      if (data.code === 200) {
                                                          message.success('删除成功!');
                                                          this.refreshTable();
                                                      } else {
                                                          message.error(data.msg)
                                                      }
                                                  })
                                              this.toggleModalVisible(false)
                                          },
                                          onCancel() {
                                              modalRef.destroy()
                                          },
                                      });
                                  }
                              }}
                              disabled={!selectedRowKeys}
                              type='danger'>
                              <Icon type="delete" />
                              删除
                          </Button>
                          <SubmitOrRecall type={1} disabled={disabled2} url="/income/invoice/collection/submit" onSuccess={this.refreshTable} />
                          <SubmitOrRecall type={2} disabled={disabled1} url="/income/invoice/collection/revoke" onSuccess={this.refreshTable} />
                          <TableTotal totalSource={totalSource} />
                      </div>}
                      style={{marginTop:10}}>

                    <AsyncTable url="/income/invoice/collection/list"
                                updateKey={tableUpDateKey}
                                filters={filters}
                                tableProps={{
                                    rowKey:record=>record.id,
                                    pagination:true,
                                    size:'small',
                                    columns:this.columns,
                                    rowSelection:{
                                        type: 'radio',
                                    },
                                    onRowSelect:(selectedRowKeys,selectedRows)=>{
                                        this.setState({
                                            selectedRowKeys,
                                            selectedRows
                                        })
                                    },
                                    scroll:{ x: '100%' },
                                    onDataChange:(dataSource)=>{
                                        this.setState({
                                            dataSource
                                        })
                                    },
                                    onTotalSource: (totalSource) => {
                                        this.setState({
                                            totalSource
                                        })
                                    },
                                }} />
                </Card>

                <PopModal
                    visible={visible}
                    modalConfig={modalConfig}
                    selectedRowKeys={selectedRowKeys}
                    refreshTable={this.refreshTable}
                    toggleModalVisible={this.toggleModalVisible}
                />
            </Layout>
        )
    }
}
export default Form.create()(withRouter(InvoiceCollection))
