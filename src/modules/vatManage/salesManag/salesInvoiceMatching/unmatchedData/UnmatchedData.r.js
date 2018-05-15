/**
 * Created by liurunbin on 2018/1/11.
 */
import React, { Component } from 'react'
import {fMoney,getUrlParam,request} from 'utils'
import {SearchTable,FileExport,TableTotal} from 'compoments'
import ManualMatchRoomModal from './manualMatchRoomModal.r'
import {message} from 'antd';
import { withRouter } from 'react-router'
import moment from 'moment';
const transformDataStatus = status =>{
    status = parseInt(status,0)
    if(status===1){
        return '暂存';
    }
    if(status===2){
        return '提交'
    }
    return status
}
const formItemStyle = {
    labelCol:{
        sm:{
            span:10,
        },
        xl:{
            span:8
        }
    },
    wrapperCol:{
        sm:{
            span:14
        },
        xl:{
            span:16
        }
    }
}
const searchFields=(disabled)=> {
    return [
        {
            label: '纳税主体',
            type: 'taxMain',
            fieldName: 'mainId',
            span:6,
            componentProps:{
                disabled,
            },
            formItemStyle,
            fieldDecoratorOptions:{
                initialValue: (disabled && getUrlParam('mainId')) || undefined,
                rules:[
                    {
                        required:true,
                        message:'请选择纳税主体'
                    }
                ]
            },
        },
        {
            label: '开票月份',
            type: 'monthPicker',
            fieldName: 'billingDate',
            span:6,
            componentProps:{
                disabled,
            },
            formItemStyle,
            fieldDecoratorOptions:{
                initialValue: (disabled && moment(getUrlParam('authMonth'), 'YYYY-MM')) || undefined,
                rules:[
                    {
                        required:true,
                        message:'请选择开票月份'
                    }
                ]
            }
        }
    ]
}
const advancedFields=[
  {
      label: '货物名称',
      type: 'input',
      fieldName: 'commodityName',
      span:6,
      formItemStyle,
      fieldDecoratorOptions: {}
  },
  {
      label: '购货单位名称',
      type: 'input',
      fieldName: 'purchaseName',
      span:6,
      formItemStyle,
      fieldDecoratorOptions: {}
  },
  {
      label: '发票号码',
      type: 'input',
      fieldName: 'invoiceNum',
      span:6,
      formItemStyle,
      fieldDecoratorOptions: {}
  },
  {
      label: '税率',
      type: 'numeric',
      fieldName: 'taxRate',
      span:6,
      formItemStyle,
      componentProps: {
          valueType: 'int'
      }
  }
]
const getColumns = context =>[
     {
        title: '操作',
        key: 'actions',
        fixed:true,
        className:'text-center',
        width:'60px',
        render: (text, record) => parseInt(context.state.dataStatus,0) === 1 ? (
            <span style={{
                color:'#1890ff',
                cursor:'pointer'
            }} onClick={()=>{
                context.setState({
                    visible:true,
                    selectedData:record
                })
            }}>
                手工匹配
            </span>
        ) : ' '
    },
    {
        title:'纳税人识别号',
        dataIndex:'purchaseTaxNum'
    },
    {
        title:'购货单位名称',
        dataIndex:'purchaseName'
    },
    {
        title:['发票类型','发票代码','发票号码'],
        dataIndex:['invoiceType','invoiceCode','invoiceNum'],
        render:(text,record)=>{
            let invoiceType=''
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
    },
    {
        title:'货物名称',
        dataIndex:'commodityName'
    },
    {
        title:'开票日期',
        dataIndex:'billingDate',
        className:'text-center',
        width:'75px'
    },
    {
        title:['价税合计','金额','税率','税额'],
        dataIndex:['totalAmount','amount','taxRate','taxAmount'],
        render:(text,record)=><div className='table-money'>
                 <p style={{marginBottom:'0px',lineHeight:'1.5',color:'#000'}}>{fMoney(record.totalAmount)}</p>
                 <p style={{marginBottom:'0px',lineHeight:'1.5',color:'#ccc'}}>{fMoney(record.amount)}</p>
                 <p style={{marginBottom:'0px',lineHeight:'1.5',color:'#ccc'}}>{record.taxRate? `${record.taxRate}%`: record.taxRate}</p>
                 <p style={{marginBottom:'0px',lineHeight:'1.5',color:'#ccc'}}>{fMoney(record.taxAmount)}</p>
               </div>

    },
    {
        title:'规格型号',
        dataIndex:'specificationModel'
    },
    {
        title:'匹配时间',
        dataIndex:'marryTime'
    },
    {
        title:['客户名称','身份证号/纳税识别码'],
        dataIndex:['customerName','taxIdentificationCode']
    },
    {
        title:['楼栋名称','单元','房号','房间编码'],
        dataIndex:['buildingName','element','roomNumber','roomCode']
    },
    {
        title:'成交总价',
        dataIndex:'totalPrice',
        render:text=>fMoney(text),
        className:'table-money'
    },
    {
        title:'匹配方式',
        dataIndex:'matchingWay',
        render:text=>{
            text = parseInt(text,0);//0:手动匹配,1:自动匹配
            if(text === 0){
                return '手动匹配';
            }else if(text ===1){
                return '自动匹配';
            }else{
                return ''
            }
        }
    },
];
class UnmatchedData extends Component{
    state={
        visible:false,
        tableKey:Date.now(),
        searchFieldsValues:{

        },
        selectedData:{},
        hasData:false,

        /**
         *修改状态和时间
         * */
        dataStatus:'',
        submitDate:'',
        totalSource:undefined,
        advancedFilterShow:false
    }
    toggleModalVisible=visible=>{
        this.setState({
            visible
        })
    }
    fetchResultStatus = ()=>{
        request.get('/output/invoice/collection/listMain',{
            params:this.state.searchFieldsValues
        })
            .then(({data})=>{
                if(data.code===200){
                    this.setState({
                        dataStatus:data.data.status,
                        submitDate:data.data.lastModifiedDate
                    })
                }else{
                    message.error(`列表主信息查询失败:${data.msg}`)
                }
            })
    }
    refreshTable = ()=>{
        this.setState({
            tableKey:Date.now()
        })
    }
    componentDidMount(){
        const {search} = this.props.location;
        if(!!search){
            this.refreshTable()
        }
    }
    render(){
        const {visible,tableKey,searchFieldsValues,selectedData,hasData,submitDate,dataStatus,totalSource} = this.state;
        const {search} = this.props.location;
        let disabled = !!search;
        return(
            <SearchTable
                doNotFetchDidMount={true}
                style={{
                    marginTop:-16
                }}
                searchOption={{
                    fields:searchFields(disabled),
                    getFieldsValues:values=>{
                        this.setState({
                            searchFieldsValues:values
                        })
                    },
                    cardProps:{
                        style:{
                            borderTop:0
                        },
                        className:''
                    }
                }}
                advancedOptions={{
                  fields:advancedFields,
                  cardStyle:{top:"72px"}
                }}
                tableOption={{
                    key:tableKey,
                    pageSize:10,
                    columns:getColumns(this),
                    url:'/output/invoice/marry/unmatched/list',
                    onSuccess:(params,data)=>{
                        this.setState({
                            searchFieldsValues:params,
                            hasData:data.length !== 0
                        },()=>{
                            this.fetchResultStatus()
                        })
                    },
                    extra:<div>
                        {
                            dataStatus && <div style={{marginRight:30,display:'inline-block'}}>
                                <span style={{marginRight:20}}>状态：<label style={{color:'#f5222d'}}>{
                                    transformDataStatus(dataStatus)
                                }</label></span>
                                {
                                    submitDate && <span>提交时间：{submitDate}</span>
                                }
                            </div>
                        }
                        <FileExport
                            url={`output/invoice/marry/unmatched/export`}
                            title="导出未匹配发票"
                            size="small"
                            setButtonStyle={{marginRight:5}}
                            disabled={!hasData}
                            params={
                                searchFieldsValues
                            }
                        />
                        <TableTotal type={2} totalSource={totalSource} />
                    </div>,
                    onTotalSource: (totalSource) => {
                        this.setState({
                            totalSource
                        })
                    },
                    scroll:{
                        x:'100%'
                    }
                }}
            >
                <ManualMatchRoomModal title="手工匹配房间" selectedData={selectedData} refreshTable={this.refreshTable} visible={visible} toggleModalVisible={this.toggleModalVisible} />
            </SearchTable>
        )
    }
}
export default withRouter(UnmatchedData)
