import { Accordion, AccordionTitleProps, ButtonProps, Flag, Form, Icon, Popup } from "semantic-ui-react";
import * as React from 'react';
import { MemberData, parseFlagName, Rank } from "../models/member"
import { makeDropdownOption } from "../utils";
import { useState } from "react";
import {CommitteeID, pushTemplateMembers} from "../models/committee";

export enum Template {
  AfricanUnion = 'African Union',
  ASEAN = 'Association of Southeast Asian Nations',
  BRICS = 'BRICS',
  EU = 'European Union',
  G20 = 'G20',
  NATO = 'North Atlantic Treaty Organization',
  SecurityCouncil = 'UN Security Council',
  UNHRC = 'UN Human Rights Council',
  UNICEF = 'UN Children\'s Fund',
  WHOHealthBoard = 'WHO Health Board',
}

export function TemplatePreview(props: { template?: Template }) {
  if (!props.template) {
    return (
      <p>Select a template to see which members will be added</p>
    );
  }

  return (
    <>
      {TEMPLATE_TO_MEMBERS[props.template]
        .map(member =>
          <div key={member.name}>
            <Flag name={parseFlagName(member.name)} />
            {member.name}
          </div>
        )}
    </>
  );
}

interface TemplateMember {
  name: MemberData['name']
  rank?: Rank // not allowed to use members due to import order
}

export function TemplateAdder(props: { committeeID: CommitteeID }) {
  const [template, setTemplate] = useState<Template | undefined>(undefined);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const openAccordion = (event: React.MouseEvent<HTMLDivElement>, data: AccordionTitleProps) => {
    const newIndex = activeIndex === data.index as number ? -1 : data.index as number;

    setActiveIndex(newIndex);
  }

  const pushTemplate = (event: React.MouseEvent<HTMLButtonElement>, data: ButtonProps) => {
    event.preventDefault();

    if (template) {
      // Add countries as per selected templates
      pushTemplateMembers(props.committeeID, template);
    }
  }


  return (
    <Accordion>
      <Accordion.Title
        active={activeIndex === 0}
        index={0}
        onClick={openAccordion}
      >
        <Icon name='dropdown' />
        Add members from a template (e.g. G20)
      </Accordion.Title>
      <Accordion.Content active={activeIndex === 0}>
        <Form>
          <Form.Dropdown
            label="Template"
            name="template"
            search
            clearable
            fluid
            selection
            placeholder="Select a template to add"
            value={template}
            options={Object.values(Template).map(makeDropdownOption)}
            onChange={(event, data) => setTemplate(data.value as Template)}
          />
          <Popup
            basic
            hoverable
            position="bottom left"
            trigger={
              <Form.Button
                icon="plus"
                disabled={!template}
                primary
                basic
                onClick={pushTemplate}
              />
            }>
            <Popup.Content>
              <TemplatePreview template={template} />
            </Popup.Content>
          </Popup>
        </Form>
      </Accordion.Content>
    </Accordion>
  )
}

export const TEMPLATE_TO_MEMBERS: Record<Template, TemplateMember[]> = {
  'African Union': [
    { name: 'Algeria' },
    { name: 'Angola' },
    { name: 'Benin' },
    { name: 'Botswana' },
    { name: 'Burkina Faso' },
    { name: 'Burundi' },
    { name: 'Cameroon' },
    { name: 'Cape Verde' },
    { name: 'Central African Republic' },
    { name: 'Chad' },
    { name: 'Comoros' },
    { name: 'Congo' },
    { name: 'Cote Divoire' },
    { name: 'Djibouti' },
    { name: 'Egypt' },
    { name: 'Equatorial Guinea' },
    { name: 'Eritrea' },
    { name: 'Ethiopia' },
    { name: 'Gabon' },
    { name: 'Ghana' },
    { name: 'Guinea-Bissau' },
    { name: 'Guinea' },
    { name: 'Kenya' },
    { name: 'Lesotho' },
    { name: 'Liberia' },
    { name: 'Libya' },
    { name: 'Madagascar' },
    { name: 'Malawi' },
    { name: 'Mali' },
    { name: 'Mauritania' },
    { name: 'Mauritius' },
    { name: 'Morocco' },
    { name: 'Mozambique' },
    { name: 'Namibia' },
    { name: 'Niger' },
    { name: 'Nigeria' },
    { name: 'Rwanda' },
    { name: 'Sao Tome' },
    { name: 'Senegal' },
    { name: 'Sierra Leone' },
    { name: 'Sudan' },
    { name: 'Tanzania' },
    { name: 'Togo' },
    { name: 'Tunisia' },
    { name: 'Uganda' },
    { name: 'Zambia' },
    { name: 'Zimbabwe' }
  ],
  'Association of Southeast Asian Nations': [
    { name: 'Brunei' },
    { name: 'Cambodia' },
    { name: 'Indonesia' },
    { name: 'Laos' },
    { name: 'Malaysia' },
    { name: 'Myanmar' },
    { name: 'Philippines' },
    { name: 'Singapore' },
    { name: 'Thailand' },
    { name: 'Vietnam' }
  ],
  'BRICS': [
    { name: 'Brazil' },
    { name: 'China' },
    { name: 'India' },
    { name: 'Russia' },
    { name: 'South Africa' }
  ],
  'European Union': [
    { name: 'Austria' },
    { name: 'Belgium' },
    { name: 'Bulgaria' },
    { name: 'Croatia' },
    { name: 'Cyprus' },
    { name: 'Czech Republic' },
    { name: 'Denmark' },
    { name: 'Estonia' },
    { name: 'Finland' },
    { name: 'France' },
    { name: 'Germany' },
    { name: 'Greece' },
    { name: 'Hungary' },
    { name: 'Ireland' },
    { name: 'Italy' },
    { name: 'Latvia' },
    { name: 'Lithuania' },
    { name: 'Luxembourg' },
    { name: 'Malta' },
    { name: 'Netherlands' },
    { name: 'Poland' },
    { name: 'Portugal' },
    { name: 'Romania' },
    { name: 'Slovakia' },
    { name: 'Slovenia' },
    { name: 'Spain' },
    { name: 'Sweden' },
  ],
  'G20': [
    { name: 'Argentina' },
    { name: 'Australia' },
    { name: 'Brazil' },
    { name: 'Canada' },
    { name: 'China' },
    { name: 'European Union' },
    { name: 'France' },
    { name: 'Germany' },
    { name: 'India' },
    { name: 'Indonesia' },
    { name: 'Italy' },
    { name: 'Japan' },
    { name: 'Mexico' },
    { name: 'Russia' },
    { name: 'Saudi Arabia' },
    { name: 'South Africa' },
    { name: 'South Korea' },
    { name: 'Turkey' },
    { name: 'United Kingdom' },
    { name: 'United States' },
  ],
  'North Atlantic Treaty Organization': [
    { name: 'Albania' },
    { name: 'Belgium' },
    { name: 'Bulgaria' },
    { name: 'Canada' },
    { name: 'Croatia' },
    { name: 'Czech Republic' },
    { name: 'Denmark' },
    { name: 'United Kingdom' },
    { name: 'Estonia' },
    { name: 'France' },
    { name: 'Germany' },
    { name: 'Greece' },
    { name: 'Hungary' },
    { name: 'Iceland' },
    { name: 'Italy' },
    { name: 'Latvia' },
    { name: 'Lithuania' },
    { name: 'Luxembourg' },
    { name: 'Macedonia' },
    { name: 'Montenegro' },
    { name: 'Netherlands Antilles' },
    { name: 'Netherlands' },
    { name: 'Norway' },
    { name: 'Poland' },
    { name: 'Portugal' },
    { name: 'Romania' },
    { name: 'Slovakia' },
    { name: 'Slovenia' },
    { name: 'Spain' },
    { name: 'Turkey' },
    { name: 'United Arab Emirates' },
    { name: 'United States' },
  ],
  'UN Security Council': [
    { name: 'Albania' },
    { name: 'Brazil' },
    { name: 'China', rank: Rank.Veto },
    { name: 'France', rank: Rank.Veto },
    { name: 'Gabon' },
    { name: 'Ghana' },
    { name: 'India' },
    { name: 'Ireland' },
    { name: 'Kenya' },
    { name: 'Mexico' },
    { name: 'Norway' },
    { name: 'Russia', rank: Rank.Veto },
    { name: 'United Arab Emirates' },
    { name: 'United Kingdom', rank: Rank.Veto },
    { name: 'United States', rank: Rank.Veto },
  ],
  'WHO Health Board': [
    { name: 'Argentina' },
    { name: 'Australia' },
    { name: 'Austria' },
    { name: 'Bangladesh' },
    { name: 'Botswana' },
    { name: 'Burkina Faso' },
    { name: 'Chile' },
    { name: 'China' },
    { name: 'Colombia' },
    { name: 'Djibouti' },
    { name: 'Finland' },
    { name: 'Gabon' },
    { name: 'Germany' },
    { name: 'Ghana' },
    { name: 'Grenada' },
    { name: 'Guinea-Bissau' },
    { name: 'Guyana' },
    { name: 'India' },
    { name: 'Indonesia' },
    { name: 'Israel' },
    { name: 'Kenya' },
    { name: 'Madagascar' },
    { name: 'Oman' },
    { name: 'United Kingdom' },
    { name: 'Romania' },
    { name: 'Russia' },
    { name: 'Singapore' },
    { name: 'South Korea' },
    { name: 'Sudan' },
    { name: 'Tajikistan' },
    { name: 'Tonga' },
    { name: 'Tunisia' },
    { name: 'United Arab Emirates' },
    { name: 'United States' }
  ],
  'UN Human Rights Council': [
    { name: 'Afghanistan' },
    { name: 'Angola' },
    { name: 'Argentina' },
    { name: 'Australia' },
    { name: 'Austria' },
    { name: 'Bahamas' },
    { name: 'Bahrain' },
    { name: 'Bangladesh' },
    { name: 'Brazil' },
    { name: 'Bulgaria' },
    { name: 'Burkina Faso' },
    { name: 'Cameroon' },
    { name: 'Chile' },
    { name: 'China' },
    { name: 'Congo' },
    { name: 'Croatia' },
    { name: 'Cuba' },
    { name: 'Czech Republic' },
    { name: 'Denmark' },
    { name: 'Egypt' },
    { name: 'United Kingdom' },
    { name: 'Eritrea' },
    { name: 'Fiji' },
    { name: 'Hungary' },
    { name: 'Iceland' },
    { name: 'Iraq' },
    { name: 'Italy' },
    { name: 'Japan' },
    { name: 'Mexico' },
    { name: 'Nepal' },
    { name: 'Nigeria' },
    { name: 'Pakistan' },
    { name: 'Peru' },
    { name: 'Philippines' },
    { name: 'Qatar' },
    { name: 'Rwanda' },
    { name: 'Saudi Arabia' },
    { name: 'Senegal' },
    { name: 'Slovakia' },
    { name: 'Somalia' },
    { name: 'South Africa' },
    { name: 'Spain' },
    { name: 'Togo' },
    { name: 'Tunisia' },
    { name: 'Ukraine' },
    { name: 'United Arab Emirates' },
    { name: 'Uruguay' }
  ],
  'UN Children\'s Fund': [
    { name: 'Bangladesh' },
    { name: 'Benin' },
    { name: 'Brazil' },
    { name: 'Burundi' },
    { name: 'Cameroon' },
    { name: 'Canada' },
    { name: 'China' },
    { name: 'Colombia' },
    { name: 'Cuba' },
    { name: 'Denmark' },
    { name: 'Djibouti' },
    { name: 'United Kingdom' },
    { name: 'Estonia' },
    { name: 'Germany' },
    { name: 'Ghana' },
    { name: 'Ireland' },
    { name: 'Japan' },
    { name: 'Lithuania' },
    { name: 'Mexico' },
    { name: 'Moldova' },
    { name: 'Mongolia' },
    { name: 'Morocco' },
    { name: 'New Zealand' },
    { name: 'Norway' },
    { name: 'Pakistan' },
    { name: 'Paraguay' },
    { name: 'Russia' },
    { name: 'South Korea' },
    { name: 'Spain' },
    { name: 'Sudan' },
    { name: 'Sweden' },
    { name: 'Switzerland' },
    { name: 'Turkmenistan' },
    { name: 'United States' },
    { name: 'Yemen' },
    { name: 'Zimbabwe' }
  ]
}