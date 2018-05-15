/**
 * Created by liurunbin on 2018/1/16.
 */
import React,{Component} from 'react'
import {SearchTable,TableTotal} from 'compoments'
import {fMoney,getUrlParam} from '../../../../../utils'
import { withRouter } from 'react-router'
import moment from 'moment';
const formItemStyle={
    labelCol:{
        span:8
    },
    wrapperCol:{
        span:14
    }
}
const searchFields = (disabled) => {
    return [
        {
            label: '开票时间',
            fieldName: 'billingDate',
            type: 'rangePicker',
            span:6,
            formItemStyle,
            componentProps:{
                disabled,
            },
            fieldDecoratorOptions:{
                initialValue: (disabled && [moment(getUrlParam('authMonth'), 'YYYY-MM-DD'), moment(getUrlParam('authMonthEnd'), 'YYYY-MM-DD')]) || undefined,
            }
        }
    ]
}

const advancedFields=[
  {
      label: '货物名称',
      fieldName: 'commodityName',
      formItemStyle,
      span:6,
      type: 'input',
  },
  {
      label: '购货单位名称',
      fieldName: 'purchaseName',
      formItemStyle,
      span:6,
      type: 'input',
  },
  {
      label: '发票号码',
      fieldName: 'invoiceNum',
      formItemStyle,
      span:6,
      type: 'input',
  },
  {
      label: '税率',
      fieldName: 'taxRate',
      formItemStyle,
      span:6,
      type: 'numeric',
      componentProps: {
          valueType: 'int'
      },
  }
]
const columns = [
    {
        title:'纳税主体',
        dataIndex:'mainName'
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
        dataIndex:'commodityName',
    },
    {
        title:'开票日期',
        dataIndex:'billingDate',
        className:'text-center'
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
];

class InvoicesWithNeedNotMatchRoom extends Component{
    state={
        tableKey:Date.now(),
        totalSource:undefined,
        advancedFilterShow:false
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
        }else{
            this.refreshTable()
        }
    }
    render(){
        const {tableKey,totalSource} = this.state;
        const {search} = this.props.location;
        let disabled = !!search;
        return(
            <SearchTable
                style={{
                    marginTop:-16
                }}
                searchOption={{
                    fields:searchFields(disabled),
                    cardProps:{
                        style:{
                            borderTop:0
                        },
                    }
                }}
                advancedOptions={{
                  fields:advancedFields,
                  cardStyle:{top:"72px"}
                }}
                tableOption={{
                    key:tableKey,
                    pageSize:10,
                    columns:columns,
                    url:'/output/invoice/marry/unwanted/list',
                    extra:<div>
                            <TableTotal totalSource={totalSource} />
                        </div>,
                    scroll:{
                        x:'100%'
                    },
                    onTotalSource: (totalSource) => {
                        this.setState({
                            totalSource
                        })
                    },
                }}
            >
            </SearchTable>
        )
    }
}
export default withRouter(InvoicesWithNeedNotMatchRoom)
