import React from 'react';
// import PropTypes from 'prop-types'
import { Button,Table } from 'antd' 
import styled from 'styled-components'
import DutySearch from '../duty/DutySearch'
// import color from '../../utils/color'

function Duty({data, event}) {
  const DutyBox = styled.div `
    .top-btn {
      margin-top: 10px;
    }
    .duty-wrap {
      margin-top: 20px;
    }
    .duty-wrap .input-ul {
      box-sizing: border-box;
      overflow:hidden;
      background-color: rgba(229, 229, 229, 1);
      padding: 20px 20px 0 20px;
      li {
        list-style: none;
        float:left;
        margin: 0 46px 20px 0;
        .input-tit {
          display:inline-block;
          width: 80px;
          margin-right: 12px;
        }
      }
    }
    .nopad td:nth-of-type(2) {
      box-sizing:border-box;
      padding: 0!important;
      margin: 0!important;
    }
  `
  return (
    <DutyBox>
      <div className='top-btn'>
        <Button type={data.dutyType === 0 ? 'primary':''} onClick={()=>{event.changeDutyType(0)}}>签到总览</Button>
        <Button type={data.dutyType === 1 ? 'primary':''} style={{marginLeft:'15px'}} onClick={()=>{event.changeDutyType(1)}}>签到记录</Button>
      </div>
      {
        data.dutyType === 0 ? 
        (
          <div className="duty-wrap">
            <Table bordered pagination={false} columns={data.allTablecolumns} dataSource={data.allTabledata} rowClassName={(record, index) => (index === 1) ? 'nopad':''} />
            <Table bordered size="middle" pagination={false} columns={data.allTablecolumns1} dataSource={data.allTabledata1} />
          </div>
        ):(
         <DutySearch></DutySearch>
        )
      }
    </DutyBox>
  );
}
Duty.propTypes = {
  // menuData: PropTypes.array.isRequired,
}
export default Duty;
